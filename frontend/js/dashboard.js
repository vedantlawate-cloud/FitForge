/* ============================================================
   FitForge — dashboard.js
   ============================================================ */

let waterTotal = 0;
const WATER_GOAL = () => AppState.settings.water_goal_ml || 2500;
const CAL_GOAL   = () => AppState.settings.calorie_goal  || 2000;

async function initDashboard() {
  const today = todayStr();
  document.getElementById('dash-date-label').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  renderWaterGlasses(0);

  try {
    const [dashData, calSummary, waterData] = await Promise.all([
      Api.get('/dashboard'),
      Api.get(`/calories/summary?date=${today}`),
      Api.get(`/calories/water?date=${today}`),
    ]);

    // Stat cards
    const cal = Math.round(parseFloat(calSummary.summary.total_calories) || 0);
    waterTotal = parseInt(waterData.total_ml) || 0;

    animateNumber(document.getElementById('dash-calories'), cal);
    animateNumber(document.getElementById('dash-water'), waterTotal);
    animateNumber(document.getElementById('dash-workouts'), dashData.recent_sessions?.length || 0);
    animateNumber(document.getElementById('dash-prs'), dashData.recent_prs?.length || 0);

    setProgress('dash-cal-bar', cal, CAL_GOAL());
    setProgress('dash-water-bar', waterTotal, WATER_GOAL());

    // Macro ring
    const s = calSummary.summary;
    updateMacroRing(
      Math.round(s.total_protein || 0),
      Math.round(s.total_carbs   || 0),
      Math.round(s.total_fat     || 0),
      cal
    );

    // Recent sessions
    renderRecentSessions(dashData.recent_sessions || []);

    // Recent PRs
    renderRecentPRsDash(dashData.recent_prs || []);

    // Water glasses
    renderWaterGlasses(waterTotal);
    document.getElementById('water-total-display').textContent = `${waterTotal} / ${WATER_GOAL()} ml`;

  } catch (err) {
    console.error('Dashboard load error:', err);
    toast('Failed to load dashboard data', 'error');
  }
}

// ── MACRO RING ────────────────────────────────────────────────
function updateMacroRing(protein, carbs, fat, totalCal) {
  const circumference = 283; // 2 * π * 45
  const goal = CAL_GOAL();

  const proteinPct = Math.min(protein / (AppState.settings.protein_goal_g || 150), 1);
  const carbsPct   = Math.min(carbs   / (AppState.settings.carbs_goal_g   || 250), 1);
  const fatPct     = Math.min(fat     / (AppState.settings.fat_goal_g     || 65),  1);

  const pRing = document.getElementById('macro-protein-ring');
  const cRing = document.getElementById('macro-carbs-ring');
  const fRing = document.getElementById('macro-fat-ring');

  if (pRing) pRing.style.strokeDashoffset = circumference * (1 - proteinPct);
  if (cRing) cRing.style.strokeDashoffset = circumference * (1 - carbsPct);
  if (fRing) fRing.style.strokeDashoffset = circumference * (1 - fatPct);

  const totalEl = document.getElementById('macro-total-cal');
  if (totalEl) animateNumber(totalEl, totalCal);

  const pv = document.getElementById('macro-protein-val');
  const cv = document.getElementById('macro-carbs-val');
  const fv = document.getElementById('macro-fat-val');
  if (pv) pv.textContent = protein + 'g';
  if (cv) cv.textContent = carbs + 'g';
  if (fv) fv.textContent = fat + 'g';

  const calGoalText = document.getElementById('cal-goal-text');
  if (calGoalText) calGoalText.textContent = `${totalCal} / ${goal} kcal`;

  setProgress('cal-goal-bar', totalCal, goal);
}

// ── RECENT SESSIONS ───────────────────────────────────────────
function renderRecentSessions(sessions) {
  const el = document.getElementById('recent-sessions-list');
  if (!sessions.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <h3>No workouts yet</h3>
        <p>Start your first session to see it here</p>
        <button class="btn btn-primary btn-sm" onclick="navigate('workout')">Start Workout</button>
      </div>`;
    return;
  }

  el.innerHTML = sessions.map(s => `
    <div class="recent-workout-item">
      <div class="workout-day-badge">🏋️</div>
      <div style="flex:1;">
        <div style="font-size:0.85rem;font-weight:600;">${s.name || s.routine_name || 'Workout'}</div>
        <div class="text-xs text-muted">${formatDate(s.started_at)}</div>
      </div>
      <div style="text-align:right;">
        ${s.duration_minutes ? `<div class="text-sm font-mono text-accent">${Math.round(s.duration_minutes)}m</div>` : ''}
        ${s.calories_burned  ? `<div class="text-xs text-muted">${s.calories_burned} kcal</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ── RECENT PRs (DASHBOARD) ────────────────────────────────────
function renderRecentPRsDash(prs) {
  const el = document.getElementById('recent-prs-list');
  if (!prs.length) {
    el.innerHTML = `<div class="text-xs text-muted" style="padding:12px 0;">No PRs recorded yet. Start lifting! 🏆</div>`;
    return;
  }
  el.innerHTML = prs.map(pr => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
      <div>
        <div class="text-sm" style="font-weight:600;">${pr.exercise_name}</div>
        <div class="text-xs text-muted">${formatDate(pr.achieved_at)}</div>
      </div>
      <div class="font-display text-orange" style="font-size:1.1rem;">${pr.value}${pr.unit}</div>
    </div>
  `).join('');
}

// ── WATER TRACKER ─────────────────────────────────────────────
function renderWaterGlasses(totalMl) {
  const container = document.getElementById('water-glasses');
  if (!container) return;
  const glassSize = 250;
  const totalGlasses = Math.ceil(WATER_GOAL() / glassSize);
  const filledGlasses = Math.floor(totalMl / glassSize);

  container.innerHTML = Array.from({ length: totalGlasses }, (_, i) => `
    <div class="water-glass ${i < filledGlasses ? 'filled' : ''}"
         onclick="logWaterQuick(250)"
         title="${(i + 1) * glassSize}ml"></div>
  `).join('');
}

async function logWaterQuick(ml) {
  try {
    await Api.post('/calories/water', { amount_ml: ml, date: todayStr() });
    waterTotal += ml;
    renderWaterGlasses(waterTotal);
    document.getElementById('water-total-display').textContent = `${waterTotal} / ${WATER_GOAL()} ml`;
    animateNumber(document.getElementById('dash-water'), waterTotal);
    setProgress('dash-water-bar', waterTotal, WATER_GOAL());
    toast(`+${ml}ml water logged 💧`, 'success', 2000);
  } catch (err) {
    toast('Failed to log water', 'error');
  }
}
