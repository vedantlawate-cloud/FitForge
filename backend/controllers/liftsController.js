const db = require('../config/db');

// GET /api/lifts/prs
exports.getPRs = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pr.*, e.name as exercise_name, e.category, e.muscle_group_primary
       FROM personal_records pr
       JOIN exercises e ON e.id = pr.exercise_id
       WHERE pr.user_id = $1
       ORDER BY pr.achieved_at DESC`,
      [req.user.id]
    );
    res.json({ prs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/lifts/history/:exerciseId
exports.getExerciseHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT wsl.weight_kg, wsl.reps, wsl.is_pr, wsl.logged_at, ws.started_at as session_date
       FROM workout_set_logs wsl
       JOIN workout_sessions ws ON ws.id = wsl.session_id
       WHERE ws.user_id = $1 AND wsl.exercise_id = $2 AND wsl.weight_kg IS NOT NULL
       ORDER BY wsl.logged_at DESC LIMIT 100`,
      [req.user.id, req.params.exerciseId]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/lifts/prs (manual PR entry)
exports.addPR = async (req, res) => {
  try {
    const { exercise_id, record_type, value, unit, reps, achieved_at, notes } = req.body;
    const result = await db.query(
      `INSERT INTO personal_records (user_id, exercise_id, record_type, value, unit, reps, achieved_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, exercise_id, record_type || '1rm', value, unit || 'kg', reps || 1, achieved_at || new Date().toISOString().split('T')[0], notes]
    );
    res.status(201).json({ pr: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/lifts/stats
exports.getStats = async (req, res) => {
  try {
    const totalSessions = await db.query(
      'SELECT COUNT(*) FROM workout_sessions WHERE user_id = $1 AND ended_at IS NOT NULL',
      [req.user.id]
    );
    const totalSets = await db.query(
      `SELECT COUNT(*) FROM workout_set_logs wsl
       JOIN workout_sessions ws ON ws.id = wsl.session_id WHERE ws.user_id = $1`,
      [req.user.id]
    );
    const totalPRs = await db.query(
      'SELECT COUNT(*) FROM personal_records WHERE user_id = $1',
      [req.user.id]
    );
    const recentPRs = await db.query(
      `SELECT pr.*, e.name as exercise_name FROM personal_records pr
       JOIN exercises e ON e.id = pr.exercise_id
       WHERE pr.user_id = $1 ORDER BY pr.achieved_at DESC LIMIT 5`,
      [req.user.id]
    );

    res.json({
      stats: {
        total_sessions: parseInt(totalSessions.rows[0].count),
        total_sets: parseInt(totalSets.rows[0].count),
        total_prs: parseInt(totalPRs.rows[0].count),
      },
      recent_prs: recentPRs.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
