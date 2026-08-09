// js/validate.js
// Pure validation helpers shared across every page. These mirror the
// rules enforced on the server (see server/controllers/authController.js)
// so users get instant feedback, while the server remains the source
// of truth and re-checks everything independently.

App.validate.isValidEmail = function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(String(email).trim());
};

App.validate.isValidFullName = function isValidFullName(name) {
  return String(name).trim().length >= 2;
};

/**
 * Scores a password from 0-4 and reports which individual rules pass.
 * Used both to drive the visual strength meter and to block weak
 * passwords before they're ever sent to the server.
 */
App.validate.scorePassword = function scorePassword(password) {
  const value = String(password || '');

  const checks = {
    length: value.length >= 8,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value)
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  let score = 0;
  if (value.length === 0) score = 0;
  else if (passedCount <= 2) score = 1; // weak
  else if (passedCount === 3) score = 2; // fair
  else if (passedCount === 4) score = 3; // good
  else if (passedCount === 5) score = 4; // strong

  const labels = ['', 'weak', 'fair', 'good', 'strong'];

  return {
    score,
    label: labels[score],
    checks,
    isStrongEnough: checks.length && checks.lower && checks.upper && checks.number && checks.special
  };
};

App.validate.passwordsMatch = function passwordsMatch(a, b) {
  return a.length > 0 && a === b;
};
