/* ============================================================
   FitForge — workout.js
   ============================================================ */

let activeSession = null;
let sessionTimerInterval = null;
let sessionStartTime = null;

async function initWorkout() {
  await Promise.all([
    loadRoutines(),
    searchExercises(),
  ]);
  restoreActiveSession();
}

// ── ROUTINES ──────────────────────────────────────────────────
async function loadRoutines() {
  try {
    const data = await Api.get('/workouts/routines');
    renderRoutines(data.routines || []);
  } catch (err) {
    toast('Failed to load routines', 'error');
  }
}

function renderRoutines(routines) {
  const grid = document.getElementById('routines-grid');
  if (!grid) return;

  if (!routines.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">📋</div>
        <h3>No routines yet</h3>
        <p>Create your first workout routine to get started</p>
        <button class="btn btn-primary" onclick="openCreateRoutineModal()">Create Routine</button>
      </div>`;
    return;
  }

  grid.innerHTML = routines.map(r => `
    <div class="routine-card ${r.is_active ? 'active-routine' : ''}" onclick="viewRoutineDetails('${r.id}')">
      <div class="flex-between mb-8">
        <div class="routine-name">${r.name}</div>
        <div style="display:flex;gap:6px;">
          ${r.is_active ? '<span class="badge badge-green">Active</span>' : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteRoutine('${r.id}')" title="Delete">✕</button>
        </div>
      </div>
      ${r.description ? `<div class="text-xs text-muted mb-8">${r.description}</div>` : ''}
      <div class="routine-meta">
        <span class="badge badge-accent">${r.goal || 'general'}</span>
        <span class="badge badge-gray">${r.days_per_week || '—'} days/week</span>
        <span class="badge badge-gray">${r.day_count || 0} days configured</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();startQuickSession('${r.id}','${r.name}')">▶ Start</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();viewRoutineDetails('${r.id}')">View</button>
      </div>
    </div>
  `).join('');
}

// ── VIEW ROUTINE DETAILS ──────────────────────────────────────
async function viewRoutineDetails(id) {
  try {
    const data = await Api.get(`/workouts/routines/${id}`);
    const { routine, days } = data;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="modal" style="max-width:600px;" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title">${routine.name}</div>
          <div class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</div>
        </div>
        <div class="flex gap-8 mb-16">
          <span class="badge badge-accent">${routine.goal}</span>
          <span class="badge badge-gray">${routine.days_per_week} days/week</span>
        </div>
        ${days.map(day => `
          <div class="day-card mb-12">
            <div class="day-title">Day ${day.day_number}${day.name ? ' — ' + day.name : ''}</div>
            ${day.exercises.map(ex => `
              <div class="exercise-row">
                <div>
                  <span class="exercise-name">${ex.exercise_name}</span>
                  <span class="badge badge-gray" style="margin-left:8px;">${ex.muscle_group_primary}</span>
                </div>
                <div class="exercise-detail">${ex.sets} × ${ex.reps_min || '?'}${ex.reps_max ? '-' + ex.reps_max : ''} reps · ${ex.rest_seconds || 90}s rest</div>
              </div>
            `).join('')}
            ${!day.exercises.length ? '<div class="text-xs text-muted">No exercises added yet</div>' : ''}
          </div>
        `).join('')}
        ${!days.length ? '<div class="empty-state"><div class="empty-icon">📅</div><h3>No days configured</h3><p>Days and exercises are added via the backend or future UI</p></div>' : ''}
        <button class="btn btn-primary w-full" style="margin-top:8px;" onclick="startQuickSession('${routine.id}','${routine.name}');this.closest('.modal-overlay').remove()">▶ Start Session</button>
      </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  } catch (err) {
    toast('Failed to load routine details', 'error');
  }
}

// ── CREATE ROUTINE ────────────────────────────────────────────
function openCreateRoutineModal() {
  openModal('create-routine-modal');
}

async function createRoutine() {
  const name = document.getElementById('r-name').value.trim();
  if (!name) { toast('Please enter a routine name', 'warning'); return; }

  try {
    await Api.post('/workouts/routines', {
      name,
      description: document.getElementById('r-desc').value.trim(),
      goal:            document.getElementById('r-goal').value,
      days_per_week:   parseInt(document.getElementById('r-days').value),
    });
    closeModal('create-routine-modal');
    document.getElementById('r-name').value = '';
    document.getElementById('r-desc').value = '';
    toast('Routine created! 💪', 'success');
    await loadRoutines();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteRoutine(id) {
  if (!confirm('Delete this routine?')) return;
  try {
    await Api.del(`/workouts/routines/${id}`);
    toast('Routine deleted', 'info');
    await loadRoutines();
  } catch (err) {
    toast('Failed to delete routine', 'error');
  }
}

// ── SESSION MANAGEMENT ────────────────────────────────────────
async function startQuickSession(routineId, routineName) {
  if (activeSession) {
    toast('A session is already active! End it first.', 'warning');
    return;
  }

  try {
    const data = await Api.post('/workouts/sessions', {
      routine_id: routineId,
      name: routineName,
    });
    activeSession = data.session;
    sessionStartTime = Date.now();
    localStorage.setItem('ff_active_session', JSON.stringify({ ...activeSession, startMs: sessionStartTime }));

    showActiveSessionBanner(routineName);
    startSessionTimer();
    toast(`Session started: ${routineName} 🚀`, 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function restoreActiveSession() {
  const stored = localStorage.getItem('ff_active_session');
  if (stored) {
    try {
      const s = JSON.parse(stored);
      activeSession = s;
      sessionStartTime = s.startMs;
      showActiveSessionBanner(s.name);
      startSessionTimer();
    } catch (e) {}
  }
}

function showActiveSessionBanner(name) {
  const banner = document.getElementById('active-session-banner');
  if (banner) {
    banner.style.display = 'flex';
    document.getElementById('active-session-name').textContent = name || 'Active Session';
  }
}

function startSessionTimer() {
  clearInterval(sessionTimerInterval);
  sessionTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const timerEl = document.getElementById('session-timer');
    if (timerEl) timerEl.textContent = formatTime(elapsed);
  }, 1000);
}

async function endCurrentSession() {
  if (!activeSession) return;
  const rating = prompt('Rate your session (1-5):');

  try {
    await Api.put(`/workouts/sessions/${activeSession.id}/end`, {
      rating: parseInt(rating) || null,
      notes: '',
    });
    clearInterval(sessionTimerInterval);
    localStorage.removeItem('ff_active_session');
    activeSession = null;

    const banner = document.getElementById('active-session-banner');
    if (banner) banner.style.display = 'none';

    toast('Session completed! Great work 🏆', 'success');
    await loadRoutines();
  } catch (err) {
    toast('Failed to end session', 'error');
  }
}

// ── EXERCISE LIBRARY ──────────────────────────────────────────
async function searchExercises() {
  const q        = document.getElementById('ex-search')?.value || '';
  const category = document.getElementById('ex-category')?.value || '';

  const params = new URLSearchParams();
  if (q)        params.set('q', q);
  if (category) params.set('category', category);

  try {
    const data = await Api.get(`/workouts/exercises?${params}`);
    renderExerciseList(data.exercises || []);
  } catch (err) {
    console.error(err);
  }
}

function renderExerciseList(exercises) {
  const container = document.getElementById('exercise-list');
  if (!container) return;

  if (!exercises.length) {
    container.innerHTML = `<div class="text-sm text-muted" style="padding:16px;">No exercises found</div>`;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Category</th>
          <th>Primary Muscle</th>
          <th>Equipment</th>
          <th>Difficulty</th>
        </tr>
      </thead>
      <tbody>
        ${exercises.map(ex => `
          <tr>
            <td><strong>${ex.name}</strong></td>
            <td><span class="badge badge-accent">${ex.category}</span></td>
            <td>${ex.muscle_group_primary || '—'}</td>
            <td><span class="badge badge-gray">${ex.equipment || 'none'}</span></td>
            <td><span class="badge ${ex.difficulty === 'beginner' ? 'badge-green' : ex.difficulty === 'advanced' ? 'badge-red' : 'badge-orange'}">${ex.difficulty}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
