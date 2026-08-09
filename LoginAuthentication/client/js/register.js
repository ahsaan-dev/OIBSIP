// js/register.js
// Page logic for register.html.

document.addEventListener('DOMContentLoaded', () => {
  App.api.redirectIfAuthenticated();
  App.ui.initPasswordToggles();

  const form = document.getElementById('registerForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('registerSubmit');

  App.ui.initStrengthMeter(passwordInput, document.getElementById('strengthMeter'));

  // --- Live, field-by-field validation -------------------------------
  fullNameInput.addEventListener('blur', () => {
    const valid = App.validate.isValidFullName(fullNameInput.value);
    App.ui.setFieldError(
      fullNameInput,
      document.getElementById('fullNameError'),
      valid ? '' : 'Please enter your full name (at least 2 characters)'
    );
  });

  emailInput.addEventListener('blur', () => {
    const valid = App.validate.isValidEmail(emailInput.value);
    App.ui.setFieldError(
      emailInput,
      document.getElementById('emailError'),
      valid ? '' : 'Please enter a valid email address'
    );
  });

  passwordInput.addEventListener('blur', () => {
    const { isStrongEnough } = App.validate.scorePassword(passwordInput.value);
    App.ui.setFieldError(
      passwordInput,
      document.getElementById('passwordError'),
      isStrongEnough ? '' : 'Use 8+ characters with upper, lower, a number, and a symbol'
    );
  });

  confirmInput.addEventListener('blur', () => {
    const valid = App.validate.passwordsMatch(passwordInput.value, confirmInput.value);
    App.ui.setFieldError(confirmInput, document.getElementById('confirmPasswordError'), valid ? '' : 'Passwords do not match');
  });

  // --- Submit ----------------------------------------------------------
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    const nameValid = App.validate.isValidFullName(fullName);
    const emailValid = App.validate.isValidEmail(email);
    const { isStrongEnough } = App.validate.scorePassword(password);
    const matchValid = App.validate.passwordsMatch(password, confirmPassword);

    App.ui.setFieldError(fullNameInput, document.getElementById('fullNameError'), nameValid ? '' : 'Please enter your full name (at least 2 characters)');
    App.ui.setFieldError(emailInput, document.getElementById('emailError'), emailValid ? '' : 'Please enter a valid email address');
    App.ui.setFieldError(passwordInput, document.getElementById('passwordError'), isStrongEnough ? '' : 'Use 8+ characters with upper, lower, a number, and a symbol');
    App.ui.setFieldError(confirmInput, document.getElementById('confirmPasswordError'), matchValid ? '' : 'Passwords do not match');

    if (!nameValid || !emailValid || !isStrongEnough || !matchValid) {
      App.ui.showToast('Please fix the highlighted fields before continuing.', 'error');
      return;
    }

    App.ui.setButtonLoading(submitBtn, true);
    try {
      await App.api.post('/auth/register', { fullName, email, password, confirmPassword });
      App.ui.showToast('Account created! Redirecting you to log in…', 'success');
      setTimeout(() => {
        window.location.href = `login.html?registered=1&email=${encodeURIComponent(email)}`;
      }, 1200);
    } catch (err) {
      App.ui.showToast(err.message, 'error');
      App.ui.setButtonLoading(submitBtn, false);
    }
  });
});
