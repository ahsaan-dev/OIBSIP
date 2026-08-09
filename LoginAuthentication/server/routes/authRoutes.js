// routes/authRoutes.js
// Public authentication endpoints: register, login, refresh, logout,
// and the forgot/reset password flow.

const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

// Slows down brute-force attempts against login and password-reset
// requests without affecting normal use.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' }
});

router.post('/register', registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/refresh', refreshAccessToken);
router.get('/logout', logoutUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
