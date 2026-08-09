// js/api.js
// Everything related to talking to the backend: where the access
// token lives, a fetch wrapper that attaches it automatically and
// retries once after a silent refresh, and the two route guards used
// by every page (requireAuth / redirectIfAuthenticated).

const ACCESS_TOKEN_KEY = 'authAccessToken';
const REMEMBER_KEY = 'authRememberMe';

// The access token is short-lived, so localStorage vs. sessionStorage
// mainly controls whether it (and the "keep me logged in" refresh
// cycle) survives closing the browser tab — that's what "Remember Me"
// means in practice, since the real long-lived credential is the
// httpOnly refresh-token cookie the server manages.
App.api.saveAccessToken = function saveAccessToken(token, rememberMe) {
  const store = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;
  store.setItem(ACCESS_TOKEN_KEY, token);
  other.removeItem(ACCESS_TOKEN_KEY);
  localStorage.setItem(REMEMBER_KEY, rememberMe ? '1' : '0');
};

App.api.getAccessToken = function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

App.api.clearAccessToken = function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
};

let refreshInFlight = null;

/**
 * Silently exchanges the httpOnly refresh cookie for a new access
 * token. Multiple simultaneous 401s share a single refresh request.
 */
async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${App.config.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh failed');
        const body = await res.json();
        const rememberMe = localStorage.getItem(REMEMBER_KEY) === '1';
        App.api.saveAccessToken(body.data.accessToken, rememberMe);
        return body.data.accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Central fetch wrapper for the whole app.
 * - Sends the access token as a Bearer header.
 * - Always sends credentials so the refresh cookie can be read.
 * - On a 401 (expired access token) it refreshes once and retries.
 * - Throws an Error with a user-friendly `.message` on failure.
 */
App.api.request = async function request(path, options = {}, _isRetry = false) {
  const token = App.api.getAccessToken();

  const response = await fetch(`${App.config.API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...(options.body && { body: JSON.stringify(options.body) })
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (err) {
    // Non-JSON response (rare) — fall through with an empty payload.
  }

  if (response.status === 401 && !_isRetry && path !== '/auth/login' && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
      return App.api.request(path, options, true);
    } catch (err) {
      App.api.clearAccessToken();
      throw new Error(payload.message || 'Your session has expired — please log in again');
    }
  }

  if (!response.ok) {
    const error = new Error(payload.message || 'Something went wrong. Please try again.');
    error.errors = payload.errors;
    error.status = response.status;
    throw error;
  }

  return payload;
};

App.api.get = (path) => App.api.request(path, { method: 'GET' });
App.api.post = (path, body) => App.api.request(path, { method: 'POST', body });
App.api.put = (path, body) => App.api.request(path, { method: 'PUT', body });

// ---------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------

/**
 * Call at the top of protected pages (dashboard, profile). Verifies
 * the session with the server (not just "is there a token in
 * storage") and redirects to login if it isn't valid. Resolves with
 * the current user on success.
 */
App.api.requireAuth = async function requireAuth() {
  try {
    const { data } = await App.api.get('/user/profile');
    return data;
  } catch (err) {
    window.location.href = 'login.html';
    return null;
  }
};

/**
 * Call at the top of login/register pages so an already-logged-in
 * user is bounced straight to the dashboard instead of seeing the
 * form again.
 */
App.api.redirectIfAuthenticated = async function redirectIfAuthenticated() {
  if (!App.api.getAccessToken()) return;
  try {
    await App.api.get('/user/profile');
    window.location.href = 'dashboard.html';
  } catch (err) {
    App.api.clearAccessToken();
  }
};
