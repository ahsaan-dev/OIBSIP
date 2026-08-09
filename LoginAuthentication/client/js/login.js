// js/login.js
// Page logic for login.html.

document.addEventListener('DOMContentLoaded', () => {
  App.api.redirectIfAuthenticated();
  App.ui.initPasswordToggles();

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberInput = document.getElementById('rememberMe');
  const submitBtn = document.getElementById('loginSubmit');

  // If we just arrived from a successful registration, prefill the
  // email and show a friendly confirmation toast.
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1') {
    if (params.get('email')) emailInput.value = params.get('email');
    App.ui.showToast('Your account is ready. Please log in.', 'success');
  }
  if (params.get('reset') === '1') {
    App.ui.showToast('Password updated. Please log in with your new password.', 'success');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const emailValid = App.validate.isValidEmail(email);
    App.ui.setFieldError(emailInput, document.getElementById('emailError'), emailValid ? '' : 'Please enter a valid email address');

    if (!emailValid || !password) {
      App.ui.showToast('Please enter your email and password.', 'error');
      return;
    }

    App.ui.setButtonLoading(submitBtn, true);
    try {
      const { data } = await App.api.post('/auth/login', { email, password, rememberMe: rememberInput.checked });
      App.api.saveAccessToken(data.accessToken, rememberInput.checked);
      App.ui.showToast(`Welcome back, ${data.user.fullName.split(' ')[0]}!`, 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (err) {
      App.ui.showToast(err.message, 'error');
      App.ui.setButtonLoading(submitBtn, false);
    }
  });
});
