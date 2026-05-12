/* ============================================================
   FitForge — auth.js
   Login, Register, Tab switching
   ============================================================ */

function switchAuthTab(tab) {
  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs         = document.querySelectorAll('.auth-tab');

  tabs.forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });

  if (tab === 'login') {
    loginForm.style.display    = 'block';
    registerForm.style.display = 'none';
  } else {
    loginForm.style.display    = 'none';
    registerForm.style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const btnText  = document.getElementById('login-btn-text');
  const spinner  = document.getElementById('login-spinner');

  btnText.style.display  = 'none';
  spinner.style.display  = 'block';

  try {
    const data = await Api.post('/auth/login', { email, password });
    Api.setToken(data.token);
    Api.setUser(data.user);
    AppState.user = data.user;

    // Load settings
    const me = await Api.get('/auth/me');
    AppState.settings = {
      calorie_goal  : me.user.calorie_goal  || 2000,
      protein_goal_g: me.user.protein_goal_g || 150,
      carbs_goal_g  : me.user.carbs_goal_g  || 250,
      fat_goal_g    : me.user.fat_goal_g    || 65,
      water_goal_ml : me.user.water_goal_ml || 2500,
    };

    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('app').style.display = 'grid';
    updateSidebarUser(data.user);
    navigate('dashboard');
    toast(`Welcome back, ${data.user.full_name || data.user.username}! 💪`, 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username  = document.getElementById('reg-username').value.trim();
  const full_name = document.getElementById('reg-name').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;

  const btnText = document.getElementById('register-btn-text');
  const spinner = document.getElementById('register-spinner');

  btnText.style.display = 'none';
  spinner.style.display = 'block';

  try {
    const data = await Api.post('/auth/register', { username, email, password, full_name });
    Api.setToken(data.token);
    Api.setUser(data.user);
    AppState.user = data.user;
    AppState.settings = { calorie_goal: 2000, protein_goal_g: 150, carbs_goal_g: 250, fat_goal_g: 65, water_goal_ml: 2500 };

    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('app').style.display = 'grid';
    updateSidebarUser(data.user);
    navigate('dashboard');
    toast(`Welcome to FitForge, ${data.user.username}! 🎉`, 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}
