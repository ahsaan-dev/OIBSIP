// controllers/userController.js
// Handles actions a logged-in user takes on their own account:
// viewing/updating their profile and changing their password.

const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// ---------------------------------------------------------------------
// @desc    Get the logged-in user's profile
// @route   GET /api/user/profile
// @access  Private
// ---------------------------------------------------------------------
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user.toPublicJSON() });
});

// ---------------------------------------------------------------------
// @desc    Update the logged-in user's profile (currently: full name)
// @route   PUT /api/user/profile
// @access  Private
// ---------------------------------------------------------------------
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  if (!fullName || fullName.trim().length < 2) {
    res.status(400);
    throw new Error('Full name must be at least 2 characters');
  }

  req.user.fullName = fullName.trim();
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: req.user.toPublicJSON()
  });
});

// ---------------------------------------------------------------------
// @desc    Change the logged-in user's password
// @route   PUT /api/user/password
// @access  Private
// ---------------------------------------------------------------------
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error('All fields are required');
  }

  if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
    res.status(400);
    throw new Error(
      'New password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character'
    );
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400);
    throw new Error('New passwords do not match');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error('New password must be different from the current password');
  }

  user.password = newPassword;
  user.refreshTokens = []; // force re-login on all other devices/sessions
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully. Please log in again.' });
});

module.exports = { getProfile, updateProfile, changePassword };
