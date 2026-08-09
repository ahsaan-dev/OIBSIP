// js/profile.js
// Page logic for profile.html.

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.shell.init();
  if (!user) return;

  App.ui.initPasswordToggles();

  document.getElementById('avatarInitials').textContent = App.ui.getInitials(user.fullName);
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileJoined').textContent = `Joined ${App.ui.formatDate(user.createdAt)}`;
  document.getElementById('emailReadonly').value = user.email;

  // ---------------------------------------------------------------
  // Update profile (full name)
  // ---------------------------------------------------------------
  const profileForm = document.getElementById('profileForm');
  const fullNameInput = document.getElementById('fullName');
  const profileSubmit = document.getElementById('profileSubmit');
  fullNameInput.value = user.fullName;

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fullName = fullNameInput.value.trim();
    const valid = App.validate.isValidFullName(fullName);
    App.ui.setFieldError(fullNameInput, document.getElementById('fullNameError'), valid ? '' : 'Please enter your full name (at least 2 characters)');
    if (!valid) return;

    App.ui.setButtonLoading(profileSubmit, true);
    try {
      const { data } = await App.api.put('/user/profile', { fullName });
      App.shell.renderUserChip(data);
      document.getElementById('avatarInitials').textContent = App.ui.getInitials(data.fullName);
      App.ui.showToast('Profile updated successfully.', 'success');
    } catch (err) {
      App.ui.showToast(err.message, 'error');
    } finally {
      App.ui.setButtonLoading(profileSubmit, false);
    }
  });

  // ---------------------------------------------------------------
  // Change password
  // ---------------------------------------------------------------
  const passwordForm = document.getElementById('passwordForm');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
  const passwordSubmit = document.getElementById('passwordSubmit');

  App.ui.initStrengthMeter(newPasswordInput, document.getElementById('strengthMeter'));

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    const { isStrongEnough } = App.validate.scorePassword(newPassword);
    const matchValid = App.validate.passwordsMatch(newPassword, confirmNewPassword);

    App.ui.setFieldError(newPasswordInput, document.getElementById('newPasswordError'), isStrongEnough ? '' : 'Use 8+ characters with upper, lower, a number, and a symbol');
    App.ui.setFieldError(confirmNewPasswordInput, document.getElementById('confirmNewPasswordError'), matchValid ? '' : 'Passwords do not match');

    if (!currentPassword || !isStrongEnough || !matchValid) {
      App.ui.showToast('Please fix the highlighted fields before continuing.', 'error');
      return;
    }

    App.ui.setButtonLoading(passwordSubmit, true);
    try {
      await App.api.put('/user/password', { currentPassword, newPassword, confirmNewPassword });
      App.ui.showToast('Password changed. Please log in again.', 'success');
      App.api.clearAccessToken();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (err) {
      App.ui.showToast(err.message, 'error');
      App.ui.setButtonLoading(passwordSubmit, false);
    }
  });
});
