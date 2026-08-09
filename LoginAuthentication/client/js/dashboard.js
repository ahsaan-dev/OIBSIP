// js/dashboard.js
// Page logic for dashboard.html.

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.shell.init();
  if (!user) return;

  // --- Welcome header ---------------------------------------------
  const firstName = user.fullName.split(' ')[0];
  document.getElementById('welcomeHeading').textContent = `Welcome back, ${firstName}`;
  document.getElementById('avatarInitials').textContent = App.ui.getInitials(user.fullName);
  document.getElementById('avatarInitialsLg').textContent = App.ui.getInitials(user.fullName);

  // --- Account status pill -----------------------------------------
  const statusPill = document.getElementById('accountStatusPill');
  statusPill.textContent = user.accountStatus === 'active' ? 'Active' : 'Suspended';
  statusPill.classList.add(`status-pill--${user.accountStatus}`);

  // --- Account information panel ------------------------------------
  document.getElementById('infoFullName').textContent = user.fullName;
  document.getElementById('infoEmail').textContent = user.email;
  document.getElementById('infoJoined').textContent = App.ui.formatDate(user.createdAt);
  document.getElementById('infoUpdated').textContent = App.ui.formatDate(user.updatedAt);

  // --- Stats ----------------------------------------------------------
  document.getElementById('statMemberSince').textContent = App.ui.formatDate(user.createdAt);
  document.getElementById('statLoginCount').textContent = user.loginHistory.filter((h) => h.success).length;
  document.getElementById('statStatus').textContent = user.accountStatus === 'active' ? 'Active' : 'Suspended';

  // --- Recent login history -------------------------------------
  const historyList = document.getElementById('loginHistoryList');
  const emptyState = document.getElementById('loginHistoryEmpty');

  if (!user.loginHistory.length) {
    emptyState.hidden = false;
  } else {
    historyList.innerHTML = '';
    user.loginHistory.forEach((entry) => {
      const row = document.createElement('li');
      row.className = 'history-row';
      row.innerHTML = `
        <span class="status-pill ${entry.success ? 'status-pill--strong' : 'status-pill--weak'}">
          ${entry.success ? 'Success' : 'Failed'}
        </span>
        <span class="history-meta">${App.ui.formatDateTime(entry.at)}</span>
      `;
      historyList.appendChild(row);
    });
  }
});
