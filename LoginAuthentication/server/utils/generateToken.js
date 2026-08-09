// utils/generateToken.js
// Small helpers around jsonwebtoken so the rest of the app never has
// to think about signing options directly.

const jwt = require('jsonwebtoken');

/**
 * Creates a short-lived JWT access token carrying the user's id.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

/**
 * Creates a longer-lived refresh token. When "rememberMe" is true it
 * lives considerably longer, matching the "Remember Me" checkbox on
 * the login page.
 */
const generateRefreshToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe
    ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'
    : process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  const token = jwt.sign({ sub: userId.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn
  });

  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  return { token, expiresAt };
};

module.exports = { generateAccessToken, generateRefreshToken };
