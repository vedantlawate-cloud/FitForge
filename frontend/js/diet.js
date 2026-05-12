/* ============================================================
   FitForge — diet.js
   ============================================================ */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DIET_ICONS = { balanced: '⚖️', keto: '🥑', paleo: '🥩', vegan: '🌱', vegetarian: '🥦', mediterranean: '🫒', carnivore: '🥩', custom: '🎯' };

async function initDiet() {
  await loadDietRoutines();
  renderWeeklyPlanner();
}

async function loadDietRoutines() {
  try {
    // NOTE: Diet routines API to be added — showing placeholder for now
    // const data = await Api.get('/diet/routines');
    renderDietRoutines([]);
  } catch (err) {
    renderDietRoutines([]);
  }
}

function renderDietRoutines(routines) {
  const container = document.getElementById('diet-routines-list');
  if (!container) return;

  if (!routines.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🥗</div>
        <h3>No diet plans yet</h3>
        <p>Create your first meal plan to stay on track</p>
        <button class="btn btn-primary" onclick="openCreateDietModal()">Create Plan</button>
      </div>`;
    return;
  }

  container.innerHTML = routines.map(r => `
    <div class="card mb-12">
      <div class="flex-between mb-8">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.5rem;">${DIET_ICONS[r.diet_type] || '🍽️'}</span>
          <div>
            <div class="routine-name">${r.name}</div>
            <span class="badge badge-accent">${r.diet_type}</span>
            ${r.is_active ? '<span class="badge badge-green" style="margin-left:4px;">Active</span>' : ''}
          </div>
        </div>
        <button class="btn btn-danger btn-sm btn-icon">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;margin-top:12px;">
        <div>
          <div class="font-display text-orange" style="font-size:1.2rem;">${r.calorie_target || '—'}</div>
          <div class="text-xs text-muted">Calories</div>
        </div>
        <div>
          <div class="font-display text-accent" style="font-size:1.2rem;">${r.protein_target_g || '—'}g</div>
          <div class="text-xs text-muted">Protein</div>
        </div>
        <div>
          <div class="font-display text-green" style="font-size:1.2rem;">${r.carbs_target_g || '—'}g</div>
          <div class="text-xs text-muted">Carbs</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── WEEKLY PLANNER ────────────────────────────────────────────
function renderWeeklyPlanner() {
  const container = document.getElementById('weekly-planner');
  if (!container) return;

  const todayDow = new Date().getDay();

  container.innerHTML = DAYS.map((day, i) => `
    <div class="day-col ${i === todayDow ? 'today' : ''}">
      <div class="day-col-header">${day}</div>
      ${generateSampleMeals(i)}
    </div>
  `).join('');
}

function generateSampleMeals(dayIndex) {
  // Placeholder meals - in production these come from diet_routine_meals table
  const sampleMeals = [
    { type: 'breakfast', name: 'Oats + Eggs' },
    { type: 'lunch',     name: 'Chicken Rice' },
    { type: 'dinner',    name: 'Salmon Bowl' },
  ];

  if (dayIndex === 0 || dayIndex === 6) {
    return `<span class="meal-pill" style="text-align:center;border-left:none;color:var(--text-muted);">Rest Day</span>`;
  }

  return sampleMeals.map(m => `
    <span class="meal-pill ${m.type}" title="${m.name}">${m.name}</span>
  `).join('');
}

// ── CREATE DIET MODAL ─────────────────────────────────────────
function openCreateDietModal() {
  openModal('create-diet-modal');
}

async function createDietRoutine() {
  const name     = document.getElementById('d-name').value.trim();
  const dietType = document.getElementById('d-type').value;
  const calories = parseInt(document.getElementById('d-calories').value) || null;
  const protein  = parseInt(document.getElementById('d-protein').value)  || null;
  const carbs    = parseInt(document.getElementById('d-carbs').value)    || null;
  const fat      = parseInt(document.getElementById('d-fat').value)      || null;

  if (!name) { toast('Please enter a plan name', 'warning'); return; }

  try {
    // POST to diet routines endpoint (to be added to backend routes)
    // await Api.post('/diet/routines', { name, diet_type: dietType, calorie_target: calories, protein_target_g: protein, carbs_target_g: carbs, fat_target_g: fat });
    toast(`Diet plan "${name}" created! 🥗`, 'success');
    closeModal('create-diet-modal');
    document.getElementById('d-name').value = '';
    await loadDietRoutines();
  } catch (err) {
    toast(err.message, 'error');
  }
}
