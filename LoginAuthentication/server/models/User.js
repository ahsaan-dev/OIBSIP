// models/User.js
// Defines the User schema: the shape of a user document in MongoDB,
// plus the logic that runs around it (password hashing, comparisons,
// reset-token generation).

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const loginHistoryEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    ip: { type: String, default: 'unknown' },
    userAgent: { type: String, default: 'unknown' },
    success: { type: Boolean, default: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [80, 'Full name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index — this is what enforces "duplicate email check"
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // never return the password hash by default
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    passwordChangedAt: {
      type: Date
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    refreshTokens: {
      // Supports multiple active sessions (e.g. several browsers/devices).
      // Each hashed refresh token is stored so a stolen .env or DB leak
      // does not directly hand over usable tokens.
      type: [
        {
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: [],
      select: false
    },
    loginHistory: {
      type: [loginHistoryEntrySchema],
      default: []
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt automatically
  }
);

// ---------------------------------------------------------------------
// Middleware: hash the password before saving, but only if it changed.
// ---------------------------------------------------------------------
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);

  // Skip on first creation so a freshly-registered user's token isn't
  // immediately treated as "issued before a password change".
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

// ---------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------

// Compares a plain-text candidate password against the stored hash.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Returns true if the password was changed after the given JWT "iat".
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

// Generates a one-time password-reset token. The raw token is emailed
// (or, for this demo, returned in the API response) while only its
// SHA-256 hash is persisted — the same principle as password hashing.
userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const minutes = Number(process.env.RESET_TOKEN_EXPIRES_IN_MIN || 30);
  this.passwordResetExpires = new Date(Date.now() + minutes * 60 * 1000);

  return rawToken;
};

// Adds a refresh token's hash to the user's active session list and
// prunes any that have already expired.
userSchema.methods.addRefreshToken = function addRefreshToken(rawToken, expiresAt) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();
  this.refreshTokens = (this.refreshTokens || []).filter((t) => t.expiresAt > now);
  this.refreshTokens.push({ tokenHash, expiresAt });
};

// Removes a single refresh token (used on logout).
userSchema.methods.removeRefreshToken = function removeRefreshToken(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.refreshTokens = (this.refreshTokens || []).filter((t) => t.tokenHash !== tokenHash);
};

// Checks whether a raw refresh token matches one currently on file.
userSchema.methods.hasRefreshToken = function hasRefreshToken(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();
  return (this.refreshTokens || []).some((t) => t.tokenHash === tokenHash && t.expiresAt > now);
};

// Shapes the public-safe version of a user (what the frontend receives).
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    accountStatus: this.accountStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    loginHistory: (this.loginHistory || []).slice(-5).reverse()
  };
};

module.exports = mongoose.model('User', userSchema);
