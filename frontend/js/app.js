/* ============================================================
   FitForge — app.js
   SPA router, utilities, global UI helpers
   ============================================================ */

// ── STATE ────────────────────────────────────────────────────
const AppState = {
  currentSection: 'dashboard',
  user: null,
  settings: {},
};

// ── SECTION MAP ──────────────────────────────────────────────
const SECTIONS = {
  dashboard : { title: 'DASHBOARD',      init: initDashboard },
  calories  : { title: 'CALORIE TRACKER', init: initCalories },
  workout   : { title: 'WORKOUT ROUTINE', init: initWorkout },
  lifts     : { title: 'LIFT TRACKER',   init: initLifts },
  diet      : { title: 'DIET ROUTINE',   init: initDiet },
  profile   : { title: 'PROFILE',        init: initProfile },
  settings  : { title: 'SETTINGS',       init: initSettings },
};

// ── ROUTER ────────────────────────────────────────────────────
function navigate(section) {
  if (!SECTIONS[section]) return;

  // Deactivate all nav items and sections
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));

  // Activate target
  const navEl = document.querySelector(`.nav-item[onclick="navigate('${section}')"]`);
  if (navEl) navEl.classList.add('active');

  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');

  // Update topbar title
  document.getElementById('topbar-title').textContent = SECTIONS[section].title;

  AppState.currentSection = section;

  // Call section initializer
  if (SECTIONS[section].init) {
    try { SECTIONS[section].init(); } catch(e) { console.error(e); }
  }

  // Close sidebar on mobile
  if (window.innerWidth < 900) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ── SIDEBAR ───────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── MODAL HELPERS ─────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = '';
}

// ── TOAST SYSTEM ─────────────────────────────────────────────
function toast(message, type = 'info', duration = 3500) {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const container = document.getElementById('toast-container');

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span style="font-size:1rem;flex-shrink:0;">${icons[type]}</span>
    <span>${message}</span>
  `;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── DATE HELPERS ──────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function setTopbarDate() {
  const now = new Date();
  document.getElementById('topbar-date').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ── NUMBER ANIMATION ──────────────────────────────────────────
function animateNumber(el, target, suffix = '', decimals = 0) {
  const start = 0;
  const duration = 800;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * ease;
    el.textContent = current.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── PROGRESS BAR HELPER ───────────────────────────────────────
function setProgress(barId, value, max) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const bar = document.getElementById(barId);
  if (bar) bar.style.width = pct + '%';
  return pct;
}

// ── SIDEBAR USER UPDATE ───────────────────────────────────────
function updateSidebarUser(user) {
  const name  = document.getElementById('sidebar-name');
  const goal  = document.getElementById('sidebar-goal');
  const avatar = document.getElementById('sidebar-avatar-el');

  if (name)  name.textContent  = user.full_name || user.username || 'Athlete';
  if (goal)  goal.textContent  = (user.fitness_goal || 'general_fitness').replace(/_/g, ' ');
  if (avatar) {
    if (user.avatar_url) {
      avatar.innerHTML = `<img src="${user.avatar_url}" alt="avatar">`;
    } else {
      const initials = (user.full_name || user.username || '?').slice(0, 2).toUpperCase();
      avatar.textContent = initials;
    }
  }
}

// ── LOGOUT ────────────────────────────────────────────────────
function logout() {
  Api.clearToken();
  AppState.user = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-page').classList.add('active');
  toast('Logged out successfully', 'info');
}

// ── CONFIRM DELETE ACCOUNT ───────────────────────────────────
function confirmDeleteAccount() {
  if (confirm('⚠️ This will permanently delete your account and all data. Are you sure?')) {
    toast('Feature coming soon', 'info');
  }
}

// ── APP BOOT ─────────────────────────────────────────────────
async function bootApp() {
  setTopbarDate();

  const token = Api.getToken();
  if (!token) {
    document.getElementById('auth-page').classList.add('active');
    return;
  }

  try {
    const data = await Api.get('/auth/me');
    AppState.user = data.user;
    AppState.settings = {
      calorie_goal  : data.user.calorie_goal  || 2000,
      protein_goal_g: data.user.protein_goal_g || 150,
      carbs_goal_g  : data.user.carbs_goal_g  || 250,
      fat_goal_g    : data.user.fat_goal_g    || 65,
      water_goal_ml : data.user.water_goal_ml || 2500,
      step_goal     : data.user.step_goal     || 10000,
    };
    Api.setUser(data.user);

    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('app').style.display = 'grid';

    updateSidebarUser(data.user);
    navigate('dashboard');
  } catch (err) {
    Api.clearToken();
    document.getElementById('auth-page').classList.add('active');
  }
}

// ── SETTINGS TAB SWITCHER ────────────────────────────────────
function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.settings-nav-item').forEach(t => t.classList.remove('active'));

  const el = document.getElementById(`settings-${tab}`);
  if (el) el.style.display = 'block';

  const navEls = document.querySelectorAll('.settings-nav-item');
  navEls.forEach(n => {
    if (n.textContent.toLowerCase().trim() === tab.replace(/_/g, ' ')) {
      n.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', bootApp);
