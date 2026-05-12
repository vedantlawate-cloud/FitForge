/* ============================================================
   FitForge — settings.js
   ============================================================ */

async function initSettings() {
  const user = AppState.user || Api.getUser();
  if (!user) return;

  // Populate goal settings
  document.getElementById('s-calorie-goal').value = user.calorie_goal  || AppState.settings.calorie_goal  || 2000;
  document.getElementById('s-protein-goal').value = user.protein_goal_g || AppState.settings.protein_goal_g || 150;
  document.getElementById('s-carbs-goal').value   = user.carbs_goal_g  || AppState.settings.carbs_goal_g  || 250;
  document.getElementById('s-fat-goal').value     = user.fat_goal_g    || AppState.settings.fat_goal_g    || 65;
  document.getElementById('s-water-goal').value   = user.water_goal_ml || AppState.settings.water_goal_ml || 2500;
  document.getElementById('s-step-goal').value    = user.step_goal     || AppState.settings.step_goal     || 10000;

  document.getElementById('s-theme').value = user.theme || 'dark';
  document.getElementById('s-units').value = user.unit_system || 'metric';

  if (user.notifications_enabled !== undefined) {
    document.getElementById('s-notif').checked = user.notifications_enabled;
  }
  if (user.weekly_report_email !== undefined) {
    document.getElementById('s-weekly-email').checked = user.weekly_report_email;
  }
}

async function saveGoalSettings() {
  const payload = {
    calorie_goal:   parseInt(document.getElementById('s-calorie-goal').value) || 2000,
    protein_goal_g: parseInt(document.getElementById('s-protein-goal').value) || 150,
    carbs_goal_g:   parseInt(document.getElementById('s-carbs-goal').value)   || 250,
    fat_goal_g:     parseInt(document.getElementById('s-fat-goal').value)     || 65,
    water_goal_ml:  parseInt(document.getElementById('s-water-goal').value)   || 2500,
    step_goal:      parseInt(document.getElementById('s-step-goal').value)    || 10000,
  };

  try {
    const data = await Api.put('/profile/settings', payload);
    // Update local app state
    Object.assign(AppState.settings, payload);
    AppState.user = { ...AppState.user, ...payload };
    Api.setUser(AppState.user);
    toast('Goals saved! 🎯', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function saveAppearanceSettings() {
  const payload = {
    theme:       document.getElementById('s-theme').value,
    unit_system: document.getElementById('s-units').value,
  };

  try {
    await Api.put('/profile/settings', payload);
    AppState.user = { ...AppState.user, ...payload };
    Api.setUser(AppState.user);
    toast('Appearance settings saved!', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function saveNotificationSettings() {
  const payload = {
    notifications_enabled: document.getElementById('s-notif').checked,
    weekly_report_email:   document.getElementById('s-weekly-email').checked,
  };

  try {
    await Api.put('/profile/settings', payload);
    toast('Notification settings saved!', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function changePassword() {
  const current = document.getElementById('s-current-pw').value;
  const newPw   = document.getElementById('s-new-pw').value;
  const confirm = document.getElementById('s-confirm-pw').value;

  if (!current || !newPw) { toast('Please fill in all password fields', 'warning'); return; }
  if (newPw !== confirm)  { toast('New passwords do not match', 'error'); return; }
  if (newPw.length < 6)   { toast('Password must be at least 6 characters', 'error'); return; }

  try {
    await Api.put('/profile/password', { current_password: current, new_password: newPw });
    document.getElementById('s-current-pw').value = '';
    document.getElementById('s-new-pw').value = '';
    document.getElementById('s-confirm-pw').value = '';
    toast('Password updated successfully! 🔒', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}
