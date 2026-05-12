const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio, date_of_birth, gender, height_cm, weight_kg, activity_level, fitness_goal, avatar_url } = req.body;
    const result = await db.query(
      `UPDATE users SET full_name=$1, bio=$2, date_of_birth=$3, gender=$4, height_cm=$5,
        weight_kg=$6, activity_level=$7, fitness_goal=$8, avatar_url=$9, updated_at=NOW()
       WHERE id=$10 RETURNING id, username, email, full_name, bio, date_of_birth, gender, height_cm, weight_kg, activity_level, fitness_goal, avatar_url`,
      [full_name, bio, date_of_birth, gender, height_cm, weight_kg, activity_level, fitness_goal, avatar_url, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { theme, unit_system, calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_ml, step_goal, notifications_enabled, weekly_report_email } = req.body;
    const result = await db.query(
      `UPDATE user_settings SET theme=$1, unit_system=$2, calorie_goal=$3, protein_goal_g=$4,
        carbs_goal_g=$5, fat_goal_g=$6, water_goal_ml=$7, step_goal=$8,
        notifications_enabled=$9, weekly_report_email=$10, updated_at=NOW()
       WHERE user_id=$11 RETURNING *`,
      [theme, unit_system, calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_ml, step_goal, notifications_enabled, weekly_report_email, req.user.id]
    );
    res.json({ settings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getBodyMeasurements = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM body_measurements WHERE user_id = $1 ORDER BY logged_date DESC LIMIT 30',
      [req.user.id]
    );
    res.json({ measurements: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addBodyMeasurement = async (req, res) => {
  try {
    const { logged_date, weight_kg, body_fat_pct, muscle_mass_kg, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, calf_cm, notes } = req.body;
    let bmi = null;
    if (weight_kg) {
      const userResult = await db.query('SELECT height_cm FROM users WHERE id = $1', [req.user.id]);
      if (userResult.rows[0].height_cm) {
        const h = userResult.rows[0].height_cm / 100;
        bmi = (weight_kg / (h * h)).toFixed(1);
      }
    }
    const result = await db.query(
      `INSERT INTO body_measurements (user_id, logged_date, weight_kg, body_fat_pct, muscle_mass_kg, bmi, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, calf_cm, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user.id, logged_date || new Date().toISOString().split('T')[0], weight_kg, body_fat_pct, muscle_mass_kg, bmi, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, calf_cm, notes]
    );
    res.status(201).json({ measurement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [caloriesSummary, waterSummary, recentSessions, recentPRs, bodyWeight] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(fl.calories), 0) as calories FROM food_logs fl WHERE fl.user_id = $1 AND fl.logged_date = $2`,
        [req.user.id, today]
      ),
      db.query(
        `SELECT COALESCE(SUM(amount_ml), 0) as water FROM water_logs WHERE user_id = $1 AND logged_date = $2`,
        [req.user.id, today]
      ),
      db.query(
        `SELECT ws.*, r.name as routine_name FROM workout_sessions ws LEFT JOIN workout_routines r ON r.id = ws.routine_id
         WHERE ws.user_id = $1 ORDER BY ws.started_at DESC LIMIT 5`,
        [req.user.id]
      ),
      db.query(
        `SELECT pr.value, pr.unit, pr.achieved_at, e.name as exercise_name
         FROM personal_records pr JOIN exercises e ON e.id = pr.exercise_id
         WHERE pr.user_id = $1 ORDER BY pr.achieved_at DESC LIMIT 3`,
        [req.user.id]
      ),
      db.query(
        `SELECT weight_kg, logged_date FROM body_measurements WHERE user_id = $1 ORDER BY logged_date DESC LIMIT 7`,
        [req.user.id]
      ),
    ]);

    res.json({
      today_calories: parseFloat(caloriesSummary.rows[0].calories),
      today_water_ml: parseInt(waterSummary.rows[0].water),
      recent_sessions: recentSessions.rows,
      recent_prs: recentPRs.rows,
      weight_history: bodyWeight.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
