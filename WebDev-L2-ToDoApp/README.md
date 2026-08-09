# Drift — A Premium Task Manager

A calmer, more capable to-do app built for the Oasis Infobyte Level 2 Web Development internship — then taken well past the brief. Drift is a single-page task manager with a glassmorphism interface, live statistics, drag-and-drop reordering, and full Local Storage persistence, built entirely in vanilla HTML, CSS, and JavaScript with zero dependencies.

![Drift screenshot](screenshots/dark-theme.png)

---

## ✨ Features

### Core (internship requirements)
- Add, edit, and delete tasks
- Mark tasks complete / restore them to pending
- Separate **Pending** and **Completed** sections
- Live task counter and completion percentage
- Friendly empty states when a list has nothing in it
- Fully responsive, from mobile to desktop
- Local Storage persistence — tasks survive a refresh
- Creation and completion timestamps on every task

### Beyond the brief
- **Search** — instant, as-you-type filtering across title and category
- **Filter** — All / Pending / Completed toggle
- **Sort** — Newest, Oldest, Alphabetical, or Priority
- **Categories** — Personal, Work, Study, Health, Errands
- **Priority levels** — High / Medium / Low, each with its own accent color and a colored "spine" on the task card
- **Due dates** — with automatic overdue highlighting
- **Drag-and-drop reordering** of pending tasks
- **Dark / light theme toggle**, remembered across visits, with a system-preference fallback on first load
- **Statistics dashboard** — an animated gradient progress ring plus total/pending/completed counts
- **Toast notifications** for every action (add, edit, delete, complete, clear, errors)
- **Keyboard shortcuts** — `N` to add a task, `/` to search, `T` to toggle theme, `Esc` to close any dialog
- **Confirmation modals** before any destructive action (delete task, clear completed, delete all)
- Accessible by design: semantic HTML5, visible focus rings, ARIA labels, `aria-live` regions, and `prefers-reduced-motion` support

---

## 🛠 Technologies used

- **HTML5** — semantic structure, `<time>`, `<dialog>`-style modals, ARIA roles
- **CSS3** — custom properties (design tokens), glassmorphism (`backdrop-filter`), CSS Grid & Flexbox, `color-mix()`, keyframe animations
- **Vanilla JavaScript (ES6+)** — modules-style IIFE, `localStorage`, event delegation, `Array` methods, no build step

No frameworks, no libraries, no bundlers. Open `index.html` and it runs.

---

## 📁 Folder structure

```
WebDev-L2-ToDoApp/
├── index.html
├── style.css
├── script.js
├── README.md
├── assets/
│   ├── images/
│   └── icons/
└── screenshots/
```

---

## 🚀 Installation & usage

No installation, no dependencies, no build tools.

1. Download or clone this folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. Start adding tasks — everything saves automatically to your browser's Local Storage.

```bash
git clone <your-repo-url>
cd WebDev-L2-ToDoApp
open index.html   # or just double-click it
```

### Using the app
- Type a task, pick a category/priority/due date, hit **Add task** (or press `Enter`).
- Click the circular checkbox to complete a task; click it again on a completed task to restore it.
- Use the pencil icon to edit a task's title, category, priority, or due date.
- Use the trash icon to delete a single task (with confirmation).
- **Clear completed** and **Delete all tasks** are available for bulk cleanup, both behind a confirmation modal.
- Drag a pending task card to reorder your list.

---

## 🧱 JavaScript architecture

The app is organized around a single in-memory `tasks` array that is the source of truth, with focused functions for each responsibility:

| Function | Responsibility |
|---|---|
| `addTask()` | Validates and creates a new task |
| `editTask()` | Updates an existing task's fields |
| `deleteTask()` | Removes a task (with exit animation) |
| `completeTask()` / `restoreTask()` | Moves a task between Pending and Completed |
| `renderAll()` / `renderColumn()` / `buildTaskCard()` | Re-render the UI from state |
| `saveTasks()` / `loadTasks()` | Local Storage persistence |
| `filterTasks()` / `searchTasks()` / `getVisibleTasks()` | Filtering, searching, sorting |
| `updateStatistics()` | Recomputes counts and the progress ring |
| `toggleTheme()` | Switches and persists the color theme |
| `showToast()` | Displays a toast notification |

---

## 📸 Screenshots

Add your own screenshots to the `screenshots/` folder — a dark-theme dashboard view and a light-theme mobile view are recommended.

---

## 🔭 Future improvements

- Subtasks / checklists within a task
- Recurring tasks
- Export/import tasks as JSON
- Multi-device sync via an account or backend
- Tagging system alongside categories

---

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## 👤 Author

Built as a submission for the Oasis Infobyte Level 2 Web Development internship track.
