// js/forgot-password.js
// Page logic for forgot-password.html.

document.addEventListener('DOMContentLoaded', () => {
  App.api.redirectIfAuthenticated();

  const form = document.getElementById('forgotForm');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('forgotSubmit');
  const successPanel = document.getElementById('forgotSuccess');
  const devPreview = document.getElementById('devPreview');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const emailValid = App.validate.isValidEmail(email);
    App.ui.setFieldError(emailInput, document.getElementById('emailError'), emailValid ? '' : 'Please enter a valid email address');
    if (!emailValid) return;

    App.ui.setButtonLoading(submitBtn, true);
    try {
      const { message, devPreview: preview } = await App.api.post('/auth/forgot-password', { email });
      App.ui.showToast(message, 'success');
      form.hidden = true;
      successPanel.hidden = false;

      // The API only includes `devPreview` outside of production,
      // since this demo has no real email service configured.
      if (preview && devPreview) {
        devPreview.hidden = false;
        devPreview.querySelector('a').href = preview.resetLink;
        devPreview.querySelector('a').textContent = preview.resetLink;
      }
    } catch (err) {
      App.ui.showToast(err.message, 'error');
    } finally {
      App.ui.setButtonLoading(submitBtn, false);
    }
  });
});
