// js/config.js
// Shared configuration + a single global namespace ("App") that every
// other script attaches to. Using one namespace instead of many loose
// global functions keeps the plain-JS codebase organized without
// needing a build step or ES module imports.

const App = {
  config: {
    // Change this if your backend runs on a different host/port.
    API_BASE_URL: 'http://localhost:5000/api'
  },
  api: {},
  ui: {},
  validate: {}
};
