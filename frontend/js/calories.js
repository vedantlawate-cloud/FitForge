/* ============================================================
   FitForge — calories.js
   ============================================================ */

let selectedFood = null;
let foodSearchTimeout = null;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', pre_workout: '⚡', post_workout: '🔋' };

async function initCalories() {
  const dateInput = document.getElementById('cal-date');
  if (!dateInput.value) dateInput.value = todayStr();
  await loadCalorieData();
}

async function loadCalorieData() {
  const date = document.getElementById('cal-date').value || todayStr();

  try {
    const [logsData, summaryData] = await Promise.all([
      Api.get(`/calories?date=${date}`),
      Api.get(`/calories/summary?date=${date}`),
    ]);

    renderCalorieSummary(summaryData.summary);
    renderMeals(logsData.logs);
  } catch (err) {
    toast('Failed to load calorie data', 'error');
  }
}

function renderCalorieSummary(s) {
  const cal     = Math.round(s.total_calories || 0);
  const protein = Math.round(s.total_protein  || 0);
  const carbs   = Math.round(s.total_carbs    || 0);
  const fat     = Math.round(s.total_fat      || 0);
  const goal    = AppState.settings.calorie_goal || 2000;
  const remaining = goal - cal;

  const calEl = document.getElementById('cal-total');
  if (calEl) animateNumber(calEl, cal);

  const pEl = document.getElementById('protein-total'); if (pEl) pEl.textContent = protein + 'g';
  const cEl = document.getElementById('carbs-total');   if (cEl) cEl.textContent = carbs + 'g';
  const fEl = document.getElementById('fat-total');     if (fEl) fEl.textContent = fat + 'g';

  const badge = document.getElementById('cal-remaining-badge');
  if (badge) {
    badge.textContent = remaining >= 0
      ? `${remaining} kcal remaining`
      : `${Math.abs(remaining)} kcal over`;
    badge.className = `badge ${remaining >= 0 ? 'badge-orange' : 'badge-red'}`;
  }

  setProgress('cal-prog',     cal,     goal);
  setProgress('protein-prog', protein, AppState.settings.protein_goal_g || 150);
  setProgress('carbs-prog',   carbs,   AppState.settings.carbs_goal_g   || 250);
  setProgress('fat-prog',     fat,     AppState.settings.fat_goal_g     || 65);
}

function renderMeals(logs) {
  const container = document.getElementById('meals-container');
  if (!container) return;

  // Group by meal type
  const grouped = {};
  MEAL_TYPES.forEach(t => { grouped[t] = []; });
  logs.forEach(log => {
    if (grouped[log.meal_type]) grouped[log.meal_type].push(log);
  });

  container.innerHTML = MEAL_TYPES.map(type => {
    const items = grouped[type];
    const totalCal = items.reduce((sum, i) => sum + parseFloat(i.calories || 0), 0);

    return `
      <div class="meal-group card mb-16">
        <div class="meal-group-header" onclick="toggleMealGroup('${type}')">
          <div class="meal-type-label">
            ${MEAL_ICONS[type]} ${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            <span class="badge badge-gray">${items.length} items</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="meal-cal-count">${Math.round(totalCal)} kcal</span>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openAddFoodModal('${type}')">+ Add</button>
          </div>
        </div>
        <div id="meal-items-${type}">
          ${items.length === 0
            ? `<div class="text-xs text-muted" style="padding:12px 14px;">Nothing logged yet</div>`
            : items.map(item => renderFoodItem(item)).join('')
          }
        </div>
      </div>
    `;
  }).join('');
}

function renderFoodItem(item) {
  const qty    = parseFloat(item.quantity_g);
  const ratio  = qty / 100;
  const cal    = Math.round(item.calories || 0);
  const protein = Math.round((item.protein_g || 0) * ratio);
  const carbs   = Math.round((item.carbs_g   || 0) * ratio);
  const fat     = Math.round((item.fat_g     || 0) * ratio);

  return `
    <div class="food-item">
      <div>
        <div class="food-item-name">${item.food_name}${item.brand ? ` <span class="text-xs text-muted">(${item.brand})</span>` : ''}</div>
        <div class="food-item-macros">
          <span class="text-accent">P: ${protein}g</span>
          <span class="text-orange">C: ${carbs}g</span>
          <span style="color:var(--yellow)">F: ${fat}g</span>
          <span>${qty}g</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="food-item-cal">${cal}</div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteFoodLog('${item.id}')" title="Remove">✕</button>
      </div>
    </div>
  `;
}

function toggleMealGroup(type) {
  const el = document.getElementById(`meal-items-${type}`);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'block';
}

// ── ADD FOOD MODAL ────────────────────────────────────────────
function openAddFoodModal(presetMealType = 'breakfast') {
  selectedFood = null;
  document.getElementById('food-search-input').value = '';
  document.getElementById('food-search-results').style.display = 'none';
  document.getElementById('selected-food-preview').style.display = 'none';
  document.getElementById('food-qty').value = '100';
  const mealSelect = document.getElementById('food-meal-type');
  if (mealSelect && presetMealType) mealSelect.value = presetMealType;
  openModal('add-food-modal');
}

async function searchFoods() {
  const q = document.getElementById('food-search-input').value.trim();
  if (q.length < 2) {
    document.getElementById('food-search-results').style.display = 'none';
    return;
  }

  clearTimeout(foodSearchTimeout);
  foodSearchTimeout = setTimeout(async () => {
    try {
      const data = await Api.get(`/calories/foods?q=${encodeURIComponent(q)}`);
      renderFoodResults(data.foods || []);
    } catch (err) {
      console.error(err);
    }
  }, 300);
}

function renderFoodResults(foods) {
  const container = document.getElementById('food-search-results');
  if (!foods.length) {
    container.innerHTML = `<div style="padding:12px;font-size:0.82rem;color:var(--text-muted);">No results found</div>`;
    container.style.display = 'block';
    return;
  }

  container.innerHTML = foods.map(f => `
    <div class="food-result-item" onclick="selectFood(${JSON.stringify(f).replace(/"/g, '&quot;')})">
      <div>
        <div style="font-size:0.85rem;font-weight:600;">${f.name}</div>
        <div class="text-xs text-muted">${f.brand || 'Generic'} · ${f.serving_description}</div>
      </div>
      <div class="text-sm font-mono text-accent">${Math.round(f.calories_per_serving)} kcal</div>
    </div>
  `).join('');
  container.style.display = 'block';
}

function selectFood(food) {
  selectedFood = food;
  document.getElementById('food-search-input').value = food.name;
  document.getElementById('food-search-results').style.display = 'none';
  document.getElementById('food-qty').value = food.serving_size_g || 100;
  updateFoodPreview();
}

function updateFoodPreview() {
  if (!selectedFood) return;
  const qty   = parseFloat(document.getElementById('food-qty').value) || 100;
  const ratio = qty / (selectedFood.serving_size_g || 100);
  const cal   = Math.round(selectedFood.calories_per_serving * ratio);

  document.getElementById('sfp-name').textContent   = selectedFood.name;
  document.getElementById('sfp-cal').textContent    = `${cal} kcal`;
  document.getElementById('sfp-macros').textContent =
    `P: ${Math.round(selectedFood.protein_g * ratio)}g | C: ${Math.round(selectedFood.carbs_g * ratio)}g | F: ${Math.round(selectedFood.fat_g * ratio)}g`;
  document.getElementById('selected-food-preview').style.display = 'block';
}

async function addFoodLog() {
  if (!selectedFood) { toast('Please select a food item first', 'warning'); return; }

  const qty       = parseFloat(document.getElementById('food-qty').value);
  const meal_type = document.getElementById('food-meal-type').value;
  const date      = document.getElementById('cal-date').value || todayStr();

  try {
    await Api.post('/calories', {
      food_id: selectedFood.id,
      meal_type,
      quantity_g: qty,
      date,
    });
    closeModal('add-food-modal');
    toast('Food logged! 🍽️', 'success');
    await loadCalorieData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteFoodLog(id) {
  if (!confirm('Remove this food entry?')) return;
  try {
    await Api.del(`/calories/${id}`);
    toast('Entry removed', 'info');
    await loadCalorieData();
  } catch (err) {
    toast('Failed to remove entry', 'error');
  }
}
