// js/app-shell.js
// Shared setup for every page inside the authenticated app shell
// (dashboard.html, profile.html): verifies the session, highlights
// the active nav link, fills in the sidebar user chip, and wires the
// logout button. Page-specific scripts call App.shell.init() first
// and then render their own content with the returned user.

App.shell = {};

App.shell.init = async function init() {
  App.ui.initSidebarToggle();
  App.shell.highlightActiveNav();

  const user = await App.api.requireAuth();
  if (!user) return null; // requireAuth already redirected to login

  App.shell.renderUserChip(user);
  App.shell.wireLogout();

  return user;
};

App.shell.highlightActiveNav = function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.app-nav-link').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === currentPage);
  });
};

App.shell.renderUserChip = function renderUserChip(user) {
  document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = user.fullName));
  document.querySelectorAll('[data-user-email]').forEach((el) => (el.textContent = user.email));
  document.querySelectorAll('[data-user-initials]').forEach((el) => (el.textContent = App.ui.getInitials(user.fullName)));
};

App.shell.wireLogout = function wireLogout() {
  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await App.api.get('/auth/logout');
      } catch (err) {
        // Even if the network call fails, clear local state and leave —
        // there's nothing useful the user can do about a failed logout.
      }
      App.api.clearAccessToken();
      window.location.href = 'login.html';
    });
  });
};
