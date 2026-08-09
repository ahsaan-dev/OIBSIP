// js/ui.js
// Shared, page-agnostic UI behaviors: toast notifications, the
// show/hide password toggle, the password strength meter display,
// button loading states, and the mobile sidebar toggle used on the
// dashboard and profile pages.

// ---------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------
(function setupToastStack() {
  App.ui.ensureToastStack = function ensureToastStack() {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('role', 'status');
      document.body.appendChild(stack);
    }
    return stack;
  };
})();

const TOAST_ICONS = {
  success: '<path d="M5 10.5l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  error: '<path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  warning: '<path d="M10 6v5M10 14h.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  info: '<path d="M10 9v5M10 6h.01" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
};

const TOAST_TITLES = {
  success: 'Success',
  error: 'Something went wrong',
  warning: 'Heads up',
  info: 'Notice'
};

/**
 * Shows a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
App.ui.showToast = function showToast(message, type = 'info', title) {
  const stack = App.ui.ensureToastStack();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 20 20">${TOAST_ICONS[type] || TOAST_ICONS.info}</svg>
    </span>
    <div class="toast-body">
      <strong>${title || TOAST_TITLES[type] || TOAST_TITLES.info}</strong>
      <p></p>
    </div>
    <button class="toast-close" aria-label="Dismiss notification">
      <svg width="12" height="12" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
    </button>
  `;
  // Set the message via textContent (not innerHTML) so it can never be
  // interpreted as markup — a small but important XSS precaution.
  toast.querySelector('.toast-body p').textContent = message;

  const remove = () => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 180);
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);
  stack.appendChild(toast);
  setTimeout(remove, 5500);
};

// ---------------------------------------------------------------------
// Button loading state
// ---------------------------------------------------------------------
App.ui.setButtonLoading = function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  if (isLoading && !button.querySelector('.spinner')) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner spinner--light';
    spinner.setAttribute('aria-hidden', 'true');
    button.appendChild(spinner);
  }
};

// ---------------------------------------------------------------------
// Show / hide password toggle
// Wire up any element matching [data-toggle-password], which should
// carry data-target="#idOfPasswordInput".
// ---------------------------------------------------------------------
App.ui.initPasswordToggles = function initPasswordToggles(scope = document) {
  scope.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      btn.innerHTML = isHidden ? EYE_OFF_ICON : EYE_ICON;
    });
  });
};

const EYE_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>';
const EYE_OFF_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a3 3 0 004.24 4.24M9.9 4.24A10.9 10.9 0 0112 4c7 0 11 7 11 7a17 17 0 01-3.9 4.6M6.6 6.6A17.1 17.1 0 001 11s4 7 11 7c1.4 0 2.7-.24 3.9-.66" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

// ---------------------------------------------------------------------
// Password strength meter
// Wire an input[data-strength-input] to a container
// [data-strength-meter] holding 4 .strength-segment elements and a
// .strength-label element.
// ---------------------------------------------------------------------
App.ui.initStrengthMeter = function initStrengthMeter(input, meterEl) {
  if (!input || !meterEl) return;
  const segments = meterEl.querySelectorAll('.strength-segment');
  const label = meterEl.querySelector('.strength-label');

  const render = () => {
    const value = input.value;
    meterEl.classList.toggle('is-visible', value.length > 0);
    const { score, label: levelLabel } = App.validate.scorePassword(value);

    segments.forEach((seg, i) => {
      const active = i < score;
      seg.classList.toggle('is-active', active);
      seg.dataset.level = levelLabel || 'weak';
    });

    if (label) {
      label.textContent = value.length === 0 ? '' : `Password strength: ${levelLabel}`;
      label.className = `strength-label status-pill status-pill--${levelLabel || 'weak'}`;
      label.style.display = value.length === 0 ? 'none' : 'inline-flex';
    }
  };

  input.addEventListener('input', render);
  render();
};

// ---------------------------------------------------------------------
// Field error helper
// ---------------------------------------------------------------------
App.ui.setFieldError = function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.add('has-error');
    input.classList.remove('has-success');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
  } else {
    input.classList.remove('has-error');
    if (input.value) input.classList.add('has-success');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  }
};

// ---------------------------------------------------------------------
// Mobile sidebar toggle (dashboard / profile app shell)
// ---------------------------------------------------------------------
App.ui.initSidebarToggle = function initSidebarToggle() {
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if (!toggle || !sidebar) return;

  const close = () => {
    sidebar.classList.remove('is-open');
    backdrop && backdrop.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
    backdrop && backdrop.classList.toggle('is-open');
  });

  backdrop && backdrop.addEventListener('click', close);
};

// ---------------------------------------------------------------------
// Small formatting helpers
// ---------------------------------------------------------------------
App.ui.getInitials = function getInitials(fullName) {
  return String(fullName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

App.ui.formatDate = function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

App.ui.formatDateTime = function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
