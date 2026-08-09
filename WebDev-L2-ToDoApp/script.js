/* ==========================================================================
   Drift — Task Manager
   Vanilla JS (ES6+), no frameworks/dependencies.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Constants & DOM references
   * ------------------------------------------------------------------ */
  const STORAGE_KEY = "drift.tasks.v1";
  const THEME_KEY = "drift.theme.v1";

  const PRIORITY_WEIGHT = { High: 0, Medium: 1, Low: 2 };

  const els = {
    form: document.getElementById("taskForm"),
    titleInput: document.getElementById("taskTitle"),
    categorySelect: document.getElementById("taskCategory"),
    prioritySelect: document.getElementById("taskPriority"),
    dueDateInput: document.getElementById("taskDueDate"),

    pendingList: document.getElementById("pendingList"),
    completedList: document.getElementById("completedList"),
    pendingEmpty: document.getElementById("pendingEmpty"),
    completedEmpty: document.getElementById("completedEmpty"),
    pendingCount: document.getElementById("pendingCount"),
    completedCount: document.getElementById("completedCount"),
    globalEmpty: document.getElementById("globalEmpty"),
    taskColumns: document.querySelector(".task-columns"),
    dangerZone: document.querySelector(".danger-zone"),

    statTotal: document.getElementById("statTotal"),
    statPending: document.getElementById("statPending"),
    statCompleted: document.getElementById("statCompleted"),
    statPercent: document.getElementById("statPercent"),
    ringFill: document.getElementById("ringFill"),

    searchInput: document.getElementById("searchInput"),
    filterBtns: document.querySelectorAll(".filter-btn"),
    sortSelect: document.getElementById("sortSelect"),

    clearCompletedBtn: document.getElementById("clearCompletedBtn"),
    deleteAllBtn: document.getElementById("deleteAllBtn"),

    themeToggle: document.getElementById("themeToggle"),
    currentDate: document.getElementById("currentDate"),

    modalBackdrop: document.getElementById("modalBackdrop"),
    modalTitle: document.getElementById("modalTitle"),
    modalMessage: document.getElementById("modalMessage"),
    modalCancelBtn: document.getElementById("modalCancelBtn"),
    modalConfirmBtn: document.getElementById("modalConfirmBtn"),

    editBackdrop: document.getElementById("editBackdrop"),
    editForm: document.getElementById("editForm"),
    editTitle: document.getElementById("editTitle"),
    editCategory: document.getElementById("editCategory"),
    editPriority: document.getElementById("editPriority"),
    editDueDate: document.getElementById("editDueDate"),
    editCancelBtn: document.getElementById("editCancelBtn"),

    shortcutsBtn: document.getElementById("shortcutsBtn"),
    shortcutsBackdrop: document.getElementById("shortcutsBackdrop"),
    shortcutsCloseBtn: document.getElementById("shortcutsCloseBtn"),

    toastContainer: document.getElementById("toastContainer"),
  };

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  let tasks = [];              // full task list, single source of truth
  let currentFilter = "all";   // all | pending | completed
  let currentSort = "newest";  // newest | oldest | az | priority
  let searchQuery = "";
  let editingTaskId = null;
  let pendingDeleteAction = null; // function to run on modal confirm
  let dragSourceId = null;

  const RING_CIRCUMFERENCE = 2 * Math.PI * 50;

  /* ------------------------------------------------------------------ *
   * Utilities
   * ------------------------------------------------------------------ */
  const uid = () => `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const formatTimestamp = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    // dateStr is YYYY-MM-DD from <input type="date">
    const [y, m, d] = dateStr.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    return due.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = (dateStr, completed) => {
    if (!dateStr || completed) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  /* ------------------------------------------------------------------ *
   * Persistence
   * ------------------------------------------------------------------ */
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      showToast("Couldn't save — storage might be full.", "danger");
    }
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (err) {
      tasks = [];
    }
  }

  function saveThemePreference(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* ignore */ }
  }

  function loadThemePreference() {
    try { return localStorage.getItem(THEME_KEY); } catch (err) { return null; }
  }

  /* ------------------------------------------------------------------ *
   * Task CRUD
   * ------------------------------------------------------------------ */
  function addTask({ title, category, priority, dueDate }) {
    const clean = title.replace(/\s+/g, " ").trim();
    if (!clean) {
      showToast("A task needs a title first.", "warn");
      return;
    }
    const now = new Date().toISOString();
    tasks.unshift({
      id: uid(),
      title: clean,
      category,
      priority,
      dueDate: dueDate || null,
      completed: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });
    saveTasks();
    renderAll();
    showToast("Task added.");
  }

  function editTask(id, updates) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    saveTasks();
    renderAll();
    showToast("Task updated.");
  }

  function deleteTask(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    const finish = () => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      renderAll();
      showToast("Task deleted.", "danger");
    };
    if (card) {
      card.classList.add("is-removing");
      card.addEventListener("animationend", finish, { once: true });
    } else {
      finish();
    }
  }

  function completeTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = true;
    task.completedAt = new Date().toISOString();
    task.updatedAt = task.completedAt;
    saveTasks();
    renderAll();
    showToast("Nice work — task completed.");
  }

  function restoreTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = false;
    task.completedAt = null;
    task.updatedAt = new Date().toISOString();
    saveTasks();
    renderAll();
    showToast("Task moved back to pending.");
  }

  function clearCompleted() {
    const hasCompleted = tasks.some((t) => t.completed);
    if (!hasCompleted) {
      showToast("Nothing to clear.", "warn");
      return;
    }
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    renderAll();
    showToast("Completed tasks cleared.");
  }

  function deleteAllTasks() {
    tasks = [];
    saveTasks();
    renderAll();
    showToast("All tasks deleted.", "danger");
  }

  function reorderTask(sourceId, targetId) {
    const sourceIndex = tasks.findIndex((t) => t.id === sourceId);
    const targetIndex = tasks.findIndex((t) => t.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
    const [moved] = tasks.splice(sourceIndex, 1);
    tasks.splice(targetIndex, 0, moved);
    saveTasks();
    renderAll();
  }

  /* ------------------------------------------------------------------ *
   * Filtering, searching, sorting
   * ------------------------------------------------------------------ */
  function getVisibleTasks(completedGroup) {
    let list = tasks.filter((t) => t.completed === completedGroup);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    switch (currentSort) {
      case "oldest":
        list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "az":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "priority":
        list = [...list].sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
        break;
      case "newest":
      default:
        list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return list;
  }

  function filterTasks(filter) {
    currentFilter = filter;
    els.filterBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    });
    renderAll();
  }

  function searchTasks(query) {
    searchQuery = query;
    renderAll();
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */
  function buildTaskCard(task) {
    const li = document.createElement("li");
    li.className = `task-card${task.completed ? " completed" : ""}`;
    li.dataset.id = task.id;
    li.style.setProperty("--priority-color", `var(--priority-${task.priority.toLowerCase()})`);
    li.draggable = !task.completed;

    const dueLabel = formatDueDate(task.dueDate);
    const overdue = isOverdue(task.dueDate, task.completed);

    li.innerHTML = `
      <button type="button" class="task-checkbox" aria-label="${task.completed ? "Mark as pending" : "Mark as completed"}">
        <svg viewBox="0 0 24 24" fill="none" stroke="#0B0E1A" stroke-width="3"><path d="m5 13 4 4 10-10" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="task-body">
        <p class="task-title"></p>
        <div class="task-meta">
          <span class="badge badge-category"></span>
          <span class="badge badge-priority-${task.priority}">${task.priority}</span>
          ${dueLabel ? `<span class="task-date${overdue ? " overdue" : ""}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
            ${dueLabel}${overdue ? " · overdue" : ""}
          </span>` : ""}
        </div>
        <div class="task-timestamps">
          <span>Created ${formatTimestamp(task.createdAt)}</span>
          ${task.completed ? `<span>· Completed ${formatTimestamp(task.completedAt)}</span>` : (task.updatedAt !== task.createdAt ? `<span>· Updated ${formatTimestamp(task.updatedAt)}</span>` : "")}
        </div>
      </div>
      <div class="task-actions">
        ${task.completed
          ? `<button type="button" class="icon-btn restore" data-action="restore" aria-label="Restore to pending">
               <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/></svg>
             </button>`
          : `<button type="button" class="icon-btn" data-action="edit" aria-label="Edit task">
               <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
             </button>`
        }
        <button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete task">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    `;

    // Set text content safely (avoids HTML injection from user-typed titles/categories)
    li.querySelector(".task-title").textContent = task.title;
    li.querySelector(".badge-category").textContent = task.category;

    return li;
  }

  function renderColumn(listEl, emptyEl, completedGroup) {
    const items = currentFilter === "all"
      ? getVisibleTasks(completedGroup)
      : (currentFilter === "completed") === completedGroup
        ? getVisibleTasks(completedGroup)
        : [];

    // When filtering to "pending" only, hide the completed column's contents (and vice versa)
    const shouldShowColumn =
      currentFilter === "all" ||
      (currentFilter === "pending" && !completedGroup) ||
      (currentFilter === "completed" && completedGroup);

    listEl.innerHTML = "";
    const column = listEl.closest(".task-column");

    if (!shouldShowColumn) {
      column.style.display = "none";
      return;
    }
    column.style.display = "";

    if (items.length === 0) {
      emptyEl.hidden = false;
    } else {
      emptyEl.hidden = true;
      const frag = document.createDocumentFragment();
      items.forEach((task) => frag.appendChild(buildTaskCard(task)));
      listEl.appendChild(frag);
    }
  }

  function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    els.statTotal.textContent = total;
    els.statPending.textContent = pending;
    els.statCompleted.textContent = completed;
    els.statPercent.textContent = `${pct}%`;
    els.pendingCount.textContent = pending;
    els.completedCount.textContent = completed;

    const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
    els.ringFill.style.strokeDashoffset = String(offset);
  }

  function renderAll() {
    const hasAnyTasks = tasks.length > 0;
    els.taskColumns.hidden = !hasAnyTasks;
    els.dangerZone.style.display = hasAnyTasks ? "flex" : "none";
    els.globalEmpty.hidden = hasAnyTasks;

    if (hasAnyTasks) {
      renderColumn(els.pendingList, els.pendingEmpty, false);
      renderColumn(els.completedList, els.completedEmpty, true);
    }
    updateStatistics();
  }

  /* ------------------------------------------------------------------ *
   * Toast notifications
   * ------------------------------------------------------------------ */
  function showToast(message, kind = "success") {
    const toast = document.createElement("div");
    toast.className = `toast${kind !== "success" ? ` toast-${kind}` : ""}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("is-leaving");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, 2600);
  }

  /* ------------------------------------------------------------------ *
   * Confirmation modal
   * ------------------------------------------------------------------ */
  function openConfirmModal(title, message, onConfirm) {
    els.modalTitle.textContent = title;
    els.modalMessage.textContent = message;
    pendingDeleteAction = onConfirm;
    els.modalBackdrop.hidden = false;
    els.modalConfirmBtn.focus();
  }

  function closeConfirmModal() {
    els.modalBackdrop.hidden = true;
    pendingDeleteAction = null;
  }

  /* ------------------------------------------------------------------ *
   * Edit modal
   * ------------------------------------------------------------------ */
  function openEditModal(task) {
    editingTaskId = task.id;
    els.editTitle.value = task.title;
    els.editCategory.value = task.category;
    els.editPriority.value = task.priority;
    els.editDueDate.value = task.dueDate || "";
    els.editBackdrop.hidden = false;
    els.editTitle.focus();
  }

  function closeEditModal() {
    els.editBackdrop.hidden = true;
    editingTaskId = null;
  }

  /* ------------------------------------------------------------------ *
   * Theme
   * ------------------------------------------------------------------ */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    els.themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    els.themeToggle.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark theme" : "Switch to light theme"
    );
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    saveThemePreference(next);
  }

  /* ------------------------------------------------------------------ *
   * Current date display
   * ------------------------------------------------------------------ */
  function renderCurrentDate() {
    els.currentDate.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric",
    });
  }

  /* ------------------------------------------------------------------ *
   * Event wiring
   * ------------------------------------------------------------------ */
  function initEvents() {
    // Add task
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      addTask({
        title: els.titleInput.value,
        category: els.categorySelect.value,
        priority: els.prioritySelect.value,
        dueDate: els.dueDateInput.value,
      });
      els.form.reset();
      els.prioritySelect.value = "Medium";
      els.titleInput.focus();
    });

    // Task list interactions (event delegation)
    [els.pendingList, els.completedList].forEach((list) => {
      list.addEventListener("click", (e) => {
        const card = e.target.closest(".task-card");
        if (!card) return;
        const id = card.dataset.id;
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        if (e.target.closest(".task-checkbox")) {
          task.completed ? restoreTask(id) : completeTask(id);
          return;
        }
        const actionBtn = e.target.closest("[data-action]");
        if (!actionBtn) return;
        const action = actionBtn.dataset.action;

        if (action === "edit") openEditModal(task);
        if (action === "restore") restoreTask(id);
        if (action === "delete") {
          openConfirmModal(
            "Delete this task?",
            `“${task.title}” will be permanently removed.`,
            () => deleteTask(id)
          );
        }
      });

      // Drag and drop reordering (pending list only, via draggable cards)
      list.addEventListener("dragstart", (e) => {
        const card = e.target.closest(".task-card");
        if (!card) return;
        dragSourceId = card.dataset.id;
        card.classList.add("is-dragging");
      });
      list.addEventListener("dragend", (e) => {
        const card = e.target.closest(".task-card");
        if (card) card.classList.remove("is-dragging");
        dragSourceId = null;
      });
      list.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      list.addEventListener("drop", (e) => {
        e.preventDefault();
        const targetCard = e.target.closest(".task-card");
        if (!targetCard || !dragSourceId) return;
        reorderTask(dragSourceId, targetCard.dataset.id);
      });
    });

    // Search
    els.searchInput.addEventListener("input", (e) => searchTasks(e.target.value));

    // Filter
    els.filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => filterTasks(btn.dataset.filter));
    });

    // Sort
    els.sortSelect.addEventListener("change", () => {
      currentSort = els.sortSelect.value;
      renderAll();
    });

    // Clear completed / delete all
    els.clearCompletedBtn.addEventListener("click", () => {
      openConfirmModal(
        "Clear completed tasks?",
        "All completed tasks will be permanently removed.",
        clearCompleted
      );
    });
    els.deleteAllBtn.addEventListener("click", () => {
      openConfirmModal(
        "Delete all tasks?",
        "This clears your entire list — pending and completed. This can't be undone.",
        deleteAllTasks
      );
    });

    // Confirm modal
    els.modalCancelBtn.addEventListener("click", closeConfirmModal);
    els.modalConfirmBtn.addEventListener("click", () => {
      if (pendingDeleteAction) pendingDeleteAction();
      closeConfirmModal();
    });
    els.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.modalBackdrop) closeConfirmModal();
    });

    // Edit modal
    els.editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!editingTaskId) return;
      editTask(editingTaskId, {
        title: els.editTitle.value.replace(/\s+/g, " ").trim() || "Untitled task",
        category: els.editCategory.value,
        priority: els.editPriority.value,
        dueDate: els.editDueDate.value || null,
      });
      closeEditModal();
    });
    els.editCancelBtn.addEventListener("click", closeEditModal);
    els.editBackdrop.addEventListener("click", (e) => {
      if (e.target === els.editBackdrop) closeEditModal();
    });

    // Theme toggle
    els.themeToggle.addEventListener("click", toggleTheme);

    // Shortcuts modal
    els.shortcutsBtn.addEventListener("click", () => { els.shortcutsBackdrop.hidden = false; });
    els.shortcutsCloseBtn.addEventListener("click", () => { els.shortcutsBackdrop.hidden = true; });
    els.shortcutsBackdrop.addEventListener("click", (e) => {
      if (e.target === els.shortcutsBackdrop) els.shortcutsBackdrop.hidden = true;
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape") {
        if (!els.modalBackdrop.hidden) closeConfirmModal();
        if (!els.editBackdrop.hidden) closeEditModal();
        if (!els.shortcutsBackdrop.hidden) els.shortcutsBackdrop.hidden = true;
        return;
      }

      if (isTyping) return;

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        els.titleInput.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        els.searchInput.focus();
      } else if (e.key.toLowerCase() === "t") {
        toggleTheme();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */
  function init() {
    const savedTheme = loadThemePreference();
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(savedTheme || (prefersLight ? "light" : "dark"));

    renderCurrentDate();
    loadTasks();
    initEvents();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
