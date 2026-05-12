/* ============================================================
   FitForge — lifts.js
   ============================================================ */

let liftChart = null;
let allExercises = [];

async function initLifts() {
  await Promise.all([
    loadPRs(),
    loadLiftStats(),
    loadExercisesForSelector(),
  ]);
}

// ── PERSONAL RECORDS ──────────────────────────────────────────
async function loadPRs() {
  try {
    const data = await Api.get('/lifts/prs');
    renderPRs(data.prs || []);
  } catch (err) {
    toast('Failed to load PRs', 'error');
  }
}

function renderPRs(prs) {
  const container = document.getElementById('prs-list');
  if (!container) return;

  if (!prs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>No PRs yet</h3>
        <p>Log your first personal record!</p>
        <button class="btn btn-primary btn-sm" onclick="openAddPRModal()">+ Log PR</button>
      </div>`;
    return;
  }

  const rankColors = ['gold', 'silver', 'bronze'];
  container.innerHTML = prs.slice(0, 10).map((pr, i) => `
    <div class="pr-card mb-8">
      <div class="pr-rank ${rankColors[i] || 'normal'}">
        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}
      </div>
      <div style="flex:1;">
        <div class="pr-exercise">${pr.exercise_name}</div>
        <div class="pr-date">${formatDate(pr.achieved_at)} · ${pr.record_type.toUpperCase()}</div>
      </div>
      <div class="pr-weight">${pr.value}<span style="font-size:0.8rem;color:var(--text-muted);">${pr.unit}</span></div>
    </div>
  `).join('');
}

// ── STATS ─────────────────────────────────────────────────────
async function loadLiftStats() {
  try {
    const data = await Api.get('/lifts/stats');
    const { stats } = data;

    const sSess = document.getElementById('stat-sessions');
    const sSets  = document.getElementById('stat-sets');
    const sPRs   = document.getElementById('stat-prs');

    if (sSess) animateNumber(sSess, stats.total_sessions || 0);
    if (sSets) animateNumber(sSets, stats.total_sets     || 0);
    if (sPRs)  animateNumber(sPRs,  stats.total_prs      || 0);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ── EXERCISE SELECTOR FOR CHART ───────────────────────────────
async function loadExercisesForSelector() {
  try {
    const data = await Api.get('/workouts/exercises?category=strength');
    allExercises = data.exercises || [];

    const selector = document.getElementById('lift-ex-selector');
    if (!selector) return;

    const popular = allExercises.slice(0, 6);
    selector.innerHTML = popular.map((ex, i) => `
      <button class="lift-ex-btn ${i === 0 ? 'active' : ''}"
        onclick="selectLiftExercise('${ex.id}', '${ex.name}', this)">
        ${ex.name}
      </button>
    `).join('');

    if (popular.length) {
      await loadLiftChart(popular[0].id, popular[0].name);
    }
  } catch (err) {
    console.error('Exercise selector error:', err);
  }
}

async function selectLiftExercise(id, name, btn) {
  document.querySelectorAll('.lift-ex-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  await loadLiftChart(id, name);
}

// ── PROGRESSION CHART ─────────────────────────────────────────
async function loadLiftChart(exerciseId, exerciseName) {
  try {
    const data = await Api.get(`/lifts/history/${exerciseId}`);
    const history = (data.history || []).reverse(); // oldest first

    const canvas = document.getElementById('lift-chart');
    if (!canvas) return;

    if (liftChart) liftChart.destroy();

    if (!history.length) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.parentElement.innerHTML += `<div class="text-xs text-muted" style="text-align:center;padding:20px;">No history for ${exerciseName} yet</div>`;
      return;
    }

    const labels = history.map(h =>
      new Date(h.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const weights = history.map(h => parseFloat(h.weight_kg));

    liftChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: exerciseName,
          data: weights,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
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
            borderColor: '#6366f1',
            borderWidth: 1,
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            callbacks: {
              label: ctx => `${ctx.parsed.y} kg`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#475569', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#475569', font: { size: 11 }, callback: v => v + 'kg' },
          },
        },
      },
    });
  } catch (err) {
    console.error('Chart error:', err);
  }
}

// ── ADD PR MODAL ──────────────────────────────────────────────
async function openAddPRModal() {
  // Populate exercise dropdown
  if (!allExercises.length) {
    try {
      const data = await Api.get('/workouts/exercises');
      allExercises = data.exercises || [];
    } catch (e) {}
  }

  const select = document.getElementById('pr-exercise');
  if (select) {
    select.innerHTML = allExercises
      .filter(e => e.category === 'strength')
      .map(e => `<option value="${e.id}">${e.name}</option>`)
      .join('');
  }

  const dateEl = document.getElementById('pr-date');
  if (dateEl) dateEl.value = todayStr();

  openModal('add-pr-modal');
}

async function addPR() {
  const exercise_id = document.getElementById('pr-exercise').value;
  const value       = parseFloat(document.getElementById('pr-weight').value);
  const reps        = parseInt(document.getElementById('pr-reps').value) || 1;
  const achieved_at = document.getElementById('pr-date').value;

  if (!exercise_id || !value) {
    toast('Please fill in exercise and weight', 'warning');
    return;
  }

  try {
    await Api.post('/lifts/prs', { exercise_id, value, reps, achieved_at, record_type: '1rm' });
    closeModal('add-pr-modal');
    toast('🏆 New PR logged! Beast mode!', 'success');
    await Promise.all([loadPRs(), loadLiftStats()]);
  } catch (err) {
    toast(err.message, 'error');
  }
}
