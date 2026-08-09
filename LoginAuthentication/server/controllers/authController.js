// controllers/authController.js
// Handles everything related to proving who a user is:
// register, login, token refresh, logout, and the forgot/reset
// password flow.

const crypto = require('crypto');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const REFRESH_COOKIE_NAME = 'refreshToken';
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Centralizes the cookie options so login/refresh/logout stay in sync.
const refreshCookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  expires: expiresAt,
  path: '/api/auth' // only sent to auth endpoints that need it
});

// ---------------------------------------------------------------------
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  if (!fullName || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error('All fields are required');
  }

  if (!validator.isEmail(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address');
  }

  if (!STRONG_PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(
      'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character'
    );
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  const user = await User.create({ fullName: fullName.trim(), email, password });

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please log in.',
    data: user.toPublicJSON()
  });
});

// ---------------------------------------------------------------------
// @desc    Authenticate a user and issue tokens
// @route   POST /api/auth/login
// @access  Public
// ---------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!user || !(await user.comparePassword(password))) {
    // If the account exists, record the failed attempt for the login
    // history / security-awareness feature before rejecting.
    if (user) {
      user.loginHistory.push({ ip, userAgent, success: false });
      await user.save({ validateBeforeSave: false });
    }
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.accountStatus === 'suspended') {
    res.status(403);
    throw new Error('This account has been suspended. Contact support for help.');
  }

  const accessToken = generateAccessToken(user._id);
  const { token: refreshToken, expiresAt } = generateRefreshToken(user._id, Boolean(rememberMe));

  user.addRefreshToken(refreshToken, expiresAt);
  user.loginHistory.push({ ip, userAgent, success: true });
  await user.save({ validateBeforeSave: false });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(expiresAt));

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m'
    }
  });
});

// ---------------------------------------------------------------------
// @desc    Exchange a valid refresh token (cookie) for a new access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh cookie)
// ---------------------------------------------------------------------
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : null;

  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided — please log in again');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    res.status(401);
    throw new Error('Your session has expired — please log in again');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user || !user.hasRefreshToken(token)) {
    res.status(401);
    throw new Error('Refresh token is no longer valid — please log in again');
  }

  // Rotate the refresh token: invalidate the old one, issue a new one.
  user.removeRefreshToken(token);
  const { token: newRefreshToken, expiresAt } = generateRefreshToken(user._id);
  user.addRefreshToken(newRefreshToken, expiresAt);
  await user.save({ validateBeforeSave: false });

  const accessToken = generateAccessToken(user._id);
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions(expiresAt));

  res.status(200).json({
    success: true,
    data: { accessToken, accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  });
});

// ---------------------------------------------------------------------
// @desc    Log the user out (invalidate refresh token, clear cookie)
// @route   GET /api/auth/logout
// @access  Public
// ---------------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.sub).select('+refreshTokens');
      if (user) {
        user.removeRefreshToken(token);
        await user.save({ validateBeforeSave: false });
      }
    } catch (err) {
      // Token was already invalid/expired — nothing to clean up server-side.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ---------------------------------------------------------------------
// @desc    Request a password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
// ---------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address');
  }

  const genericMessage =
    'If an account exists for that email, a password reset link has been sent.';

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way whether or not the account exists, so
  // this endpoint can't be used to discover registered emails.
  if (!user) {
    return res.status(200).json({ success: true, message: genericMessage });
  }

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In production this would be emailed via a transactional email
  // service (e.g. SendGrid, SES). For local development there is no
  // email provider configured, so the reset link is logged to the
  // server console and also returned in the response for convenience.
  const resetLink = `${req.protocol}://${req.get('host').replace(/:\d+$/, '')}:5500/client/reset-password.html?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  console.log(`\n🔐 Password reset requested for ${user.email}`);
  console.log(`   Reset link (valid for ${process.env.RESET_TOKEN_EXPIRES_IN_MIN || 30} min): ${resetLink}\n`);

  res.status(200).json({
    success: true,
    message: genericMessage,
    // devPreview only exists to make local testing possible without an
    // email server — remove this field before deploying to production.
    devPreview: process.env.NODE_ENV !== 'production' ? { resetLink, rawToken } : undefined
  });
});

// ---------------------------------------------------------------------
// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ---------------------------------------------------------------------
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    res.status(400);
    throw new Error('Please enter and confirm your new password');
  }

  if (!STRONG_PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(
      'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character'
    );
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) {
    res.status(400);
    throw new Error('That reset link is invalid or has expired');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // log out of every existing session for safety
  await user.save();

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.'
  });
});

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword
};
