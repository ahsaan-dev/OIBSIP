// js/reset-password.js
// Page logic for reset-password.html — reads the token/email from the
// URL (the link sent to the user) and submits a new password.

document.addEventListener('DOMContentLoaded', () => {
  App.ui.initPasswordToggles();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const email = params.get('email');

  const form = document.getElementById('resetForm');
  const invalidPanel = document.getElementById('resetInvalid');
  const emailDisplay = document.getElementById('emailDisplay');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('resetSubmit');

  if (!token) {
    form.hidden = true;
    invalidPanel.hidden = false;
    return;
  }

  if (email && emailDisplay) emailDisplay.textContent = email;

  App.ui.initStrengthMeter(passwordInput, document.getElementById('strengthMeter'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    const { isStrongEnough } = App.validate.scorePassword(password);
    const matchValid = App.validate.passwordsMatch(password, confirmPassword);

    App.ui.setFieldError(passwordInput, document.getElementById('passwordError'), isStrongEnough ? '' : 'Use 8+ characters with upper, lower, a number, and a symbol');
    App.ui.setFieldError(confirmInput, document.getElementById('confirmPasswordError'), matchValid ? '' : 'Passwords do not match');

    if (!isStrongEnough || !matchValid) {
      App.ui.showToast('Please fix the highlighted fields before continuing.', 'error');
      return;
    }

    App.ui.setButtonLoading(submitBtn, true);
    try {
      await App.api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password, confirmPassword });
      App.ui.showToast('Password reset! Redirecting to login…', 'success');
      setTimeout(() => {
        window.location.href = 'login.html?reset=1';
      }, 1000);
    } catch (err) {
      App.ui.showToast(err.message, 'error');
      App.ui.setButtonLoading(submitBtn, false);
    }
  });
});
