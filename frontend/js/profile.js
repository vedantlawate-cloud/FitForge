/* ============================================================
   FitForge — profile.js
   ============================================================ */

let weightChartInstance = null;

async function initProfile() {
  const user = AppState.user || Api.getUser();
  if (!user) return;

  renderProfileHeader(user);
  await Promise.all([
    loadBodyMeasurements(),
    loadProfileStats(),
  ]);
}

function renderProfileHeader(user) {
  const nameEl     = document.getElementById('profile-full-name');
  const handleEl   = document.getElementById('profile-username');
  const avatarEl   = document.getElementById('profile-avatar-lg');

  if (nameEl)   nameEl.textContent   = user.full_name || user.username || 'Athlete';
  if (handleEl) handleEl.textContent = '@' + (user.username || '—');

  if (avatarEl) {
    if (user.avatar_url) {
      avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="avatar">`;
    } else {
      avatarEl.textContent = (user.full_name || user.username || '?').slice(0, 2).toUpperCase();
    }
  }
}

async function loadProfileStats() {
  try {
    const [liftsStats, dashData] = await Promise.all([
      Api.get('/lifts/stats'),
      Api.get('/dashboard'),
    ]);

    const sEl = document.getElementById('pstat-sessions');
    const pEl = document.getElementById('pstat-prs');
    if (sEl) animateNumber(sEl, liftsStats.stats?.total_sessions || 0);
    if (pEl) animateNumber(pEl, liftsStats.stats?.total_prs      || 0);
  } catch (err) {
    console.error('Profile stats error:', err);
  }
}

async function loadBodyMeasurements() {
  try {
    const data = await Api.get('/profile/measurements');
    const measurements = data.measurements || [];
    renderBodyStats(measurements);
    renderWeightChart(measurements);
  } catch (err) {
    console.error('Measurements error:', err);
  }
}

function renderBodyStats(measurements) {
  const container = document.getElementById('body-stats-list');
  if (!container) return;

  const latest = measurements[0];
  const user   = AppState.user || Api.getUser();

  const rows = [
    { label: 'Height',      value: user?.height_cm ? `${user.height_cm} cm` : '—',               icon: '📏' },
    { label: 'Weight',      value: latest?.weight_kg ? `${latest.weight_kg} kg` : '—',           icon: '⚖️' },
    { label: 'BMI',         value: latest?.bmi       ? latest.bmi                : '—',           icon: '📊' },
    { label: 'Body Fat',    value: latest?.body_fat_pct ? `${latest.body_fat_pct}%` : '—',        icon: '🔥' },
    { label: 'Chest',       value: latest?.chest_cm  ? `${latest.chest_cm} cm`  : '—',           icon: '💪' },
    { label: 'Waist',       value: latest?.waist_cm  ? `${latest.waist_cm} cm`  : '—',           icon: '📐' },
  ];

  container.innerHTML = rows.map(row => `
    <div class="settings-list-item" style="padding:12px 0;">
      <div class="flex gap-8" style="align-items:center;">
        <span>${row.icon}</span>
        <div class="settings-item-label">${row.label}</div>
      </div>
      <div class="font-mono text-sm text-accent">${row.value}</div>
    </div>
  `).join('');
}

function renderWeightChart(measurements) {
  const canvas = document.getElementById('weight-chart');
  if (!canvas) return;

  const sorted = [...measurements].reverse(); // oldest first
  if (!sorted.length) {
    canvas.parentElement.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><h3>No weight data</h3><p>Log a measurement to see your progress</p></div>`;
    return;
  }

  if (weightChartInstance) weightChartInstance.destroy();

  const labels  = sorted.map(m => formatDate(m.logged_date));
  const weights  = sorted.map(m => parseFloat(m.weight_kg));

  weightChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data: weights,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#f97316',
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e1e28',
          borderColor: '#f97316',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#475569' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#475569', callback: v => v + 'kg' } },
      },
    },
  });
}

// ── EDIT PROFILE MODAL ────────────────────────────────────────
function openEditProfileModal() {
  const user = AppState.user || Api.getUser();
  if (!user) return;

  document.getElementById('ep-name').value   = user.full_name  || '';
  document.getElementById('ep-bio').value    = user.bio        || '';
  document.getElementById('ep-height').value = user.height_cm  || '';
  document.getElementById('ep-weight').value = user.weight_kg  || '';
  document.getElementById('ep-gender').value = user.gender     || '';
  document.getElementById('ep-goal').value   = user.fitness_goal || 'maintain';
  if (user.date_of_birth) {
    document.getElementById('ep-dob').value = user.date_of_birth.split('T')[0];
  }

  openModal('edit-profile-modal');
}

async function saveProfile() {
  const payload = {
    full_name:     document.getElementById('ep-name').value.trim(),
    bio:           document.getElementById('ep-bio').value.trim(),
    height_cm:     parseFloat(document.getElementById('ep-height').value) || null,
    weight_kg:     parseFloat(document.getElementById('ep-weight').value) || null,
    gender:        document.getElementById('ep-gender').value || null,
    fitness_goal:  document.getElementById('ep-goal').value,
    date_of_birth: document.getElementById('ep-dob').value || null,
  };

  try {
    const data = await Api.put('/profile', payload);
    AppState.user = { ...AppState.user, ...data.user };
    Api.setUser(AppState.user);

    closeModal('edit-profile-modal');
    renderProfileHeader(AppState.user);
    updateSidebarUser(AppState.user);
    toast('Profile updated! ✅', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── BODY MEASUREMENT MODAL ────────────────────────────────────
function openMeasurementModal() {
  openModal('measurement-modal');
}

async function saveMeasurement() {
  const payload = {
    weight_kg:    parseFloat(document.getElementById('m-weight').value) || null,
    body_fat_pct: parseFloat(document.getElementById('m-bf').value)     || null,
    chest_cm:     parseFloat(document.getElementById('m-chest').value)  || null,
    waist_cm:     parseFloat(document.getElementById('m-waist').value)  || null,
    hips_cm:      parseFloat(document.getElementById('m-hips').value)   || null,
    bicep_cm:     parseFloat(document.getElementById('m-bicep').value)  || null,
    thigh_cm:     parseFloat(document.getElementById('m-thigh').value)  || null,
    notes:        document.getElementById('m-notes').value.trim(),
  };

  try {
    await Api.post('/profile/measurements', payload);
    closeModal('measurement-modal');
    toast('Measurement saved! 📏', 'success');
    await loadBodyMeasurements();
  } catch (err) {
    toast(err.message, 'error');
  }
}
