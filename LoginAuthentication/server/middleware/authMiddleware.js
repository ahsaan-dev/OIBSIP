// middleware/authMiddleware.js
// Verifies the JWT access token on protected routes and attaches the
// authenticated user to req.user.

const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

/**
 * Pulls the access token out of either the Authorization header
 * ("Bearer <token>") or an httpOnly cookie, whichever is present.
 */
const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    const error = new Error('Not authorized — no token provided');
    error.statusCode = 401;
    throw error;
  }

  // jwt.verify throws (caught by asyncHandler) if invalid or expired —
  // errorMiddleware turns that into a clean 401 response.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.sub);
  if (!user) {
    const error = new Error('The user for this token no longer exists');
    error.statusCode = 401;
    throw error;
  }

  if (user.accountStatus === 'suspended') {
    const error = new Error('This account has been suspended');
    error.statusCode = 403;
    throw error;
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    const error = new Error('Password was changed recently — please log in again');
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

module.exports = { protect };
