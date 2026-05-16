/* ============================================================
   FitForge — api.js
   Centralized API client with JWT auth
   Also defines AppState here so it is available to ALL section
   JS files regardless of load order.
   ============================================================ */

// ── GLOBAL APP STATE — defined here so every file can access it ──
const AppState = {
  currentSection: 'dashboard',
  user: null,
  settings: {
    calorie_goal  : 2000,
    protein_goal_g: 150,
    carbs_goal_g  : 250,
    fat_goal_g    : 65,
    water_goal_ml : 2500,
    step_goal     : 10000,
  },
};

const API_BASE = '/api';

const Api = {
  getToken() {
    return localStorage.getItem('ff_token');
  },

  setToken(token) {
    localStorage.setItem('ff_token', token);
  },

  clearToken() {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('ff_user') || 'null');
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('ff_user', JSON.stringify(user));
  },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();

      if (res.status === 401) {
        this.clearToken();
        window.location.reload();
        return null;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Make sure the backend is running.');
      }
      throw err;
    }
  },

  get(path)         { return this.request('GET',    path); },
  post(path, body)  { return this.request('POST',   path, body); },
  put(path, body)   { return this.request('PUT',    path, body); },
  del(path)         { return this.request('DELETE', path); },
};
