const db = require('../config/db');

// ---- ROUTINES ----
exports.getRoutines = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM workout_days d WHERE d.routine_id = r.id) as day_count
       FROM workout_routines r WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ routines: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createRoutine = async (req, res) => {
  try {
    const { name, description, goal, days_per_week, estimated_duration_min } = req.body;
    const result = await db.query(
      `INSERT INTO workout_routines (user_id, name, description, goal, days_per_week, estimated_duration_min)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, name, description, goal, days_per_week, estimated_duration_min]
    );
    res.status(201).json({ routine: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getRoutineDetails = async (req, res) => {
  try {
    const routineResult = await db.query(
      'SELECT * FROM workout_routines WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!routineResult.rows.length) return res.status(404).json({ error: 'Not found' });

    const daysResult = await db.query(
      'SELECT * FROM workout_days WHERE routine_id = $1 ORDER BY day_number',
      [req.params.id]
    );

    const days = await Promise.all(daysResult.rows.map(async (day) => {
      const exercisesResult = await db.query(
        `SELECT wde.*, e.name as exercise_name, e.category, e.muscle_group_primary, e.equipment
         FROM workout_day_exercises wde
         JOIN exercises e ON e.id = wde.exercise_id
         WHERE wde.workout_day_id = $1
         ORDER BY wde.order_index`,
        [day.id]
      );
      return { ...day, exercises: exercisesResult.rows };
    }));

    res.json({ routine: routineResult.rows[0], days });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteRoutine = async (req, res) => {
  try {
    await db.query('DELETE FROM workout_routines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ---- SESSIONS ----
exports.startSession = async (req, res) => {
  try {
    const { routine_id, workout_day_id, name } = req.body;
    const result = await db.query(
      `INSERT INTO workout_sessions (user_id, routine_id, workout_day_id, name, started_at)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [req.user.id, routine_id || null, workout_day_id || null, name || 'Workout Session']
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { calories_burned, notes, rating } = req.body;
    const result = await db.query(
      `UPDATE workout_sessions SET ended_at = NOW(),
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at))/60,
        calories_burned = $2, notes = $3, rating = $4
       WHERE id = $1 AND user_id = $5 RETURNING *`,
      [req.params.id, calories_burned, notes, rating, req.user.id]
    );
    res.json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logSet = async (req, res) => {
  try {
    const { exercise_id, set_number, weight_kg, reps, duration_seconds, distance_m, rpe, notes } = req.body;

    // Check PR
    const prResult = await db.query(
      `SELECT value FROM personal_records WHERE user_id = $1 AND exercise_id = $2 AND record_type = '1rm' ORDER BY value DESC LIMIT 1`,
      [req.user.id, exercise_id]
    );
    const is_pr = prResult.rows.length === 0 || (weight_kg && weight_kg > prResult.rows[0].value);

    const result = await db.query(
      `INSERT INTO workout_set_logs (session_id, exercise_id, set_number, weight_kg, reps, duration_seconds, distance_m, rpe, is_pr, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.params.sessionId, exercise_id, set_number, weight_kg, reps, duration_seconds, distance_m, rpe, is_pr, notes]
    );

    if (is_pr && weight_kg) {
      await db.query(
        `INSERT INTO personal_records (user_id, exercise_id, record_type, value, unit, reps, session_id)
         VALUES ($1,$2,'1rm',$3,'kg',$4,$5)
         ON CONFLICT DO NOTHING`,
        [req.user.id, exercise_id, weight_kg, reps, req.params.sessionId]
      );
    }

    res.status(201).json({ set: result.rows[0], is_pr });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ws.*, r.name as routine_name
       FROM workout_sessions ws LEFT JOIN workout_routines r ON r.id = ws.routine_id
       WHERE ws.user_id = $1 ORDER BY ws.started_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ---- EXERCISES ----
exports.getExercises = async (req, res) => {
  try {
    const { category, equipment, q } = req.query;
    let query = 'SELECT * FROM exercises WHERE 1=1';
    const params = [];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    if (equipment) { params.push(equipment); query += ` AND equipment = $${params.length}`; }
    if (q) { params.push(`%${q}%`); query += ` AND name ILIKE $${params.length}`; }
    query += ' ORDER BY name LIMIT 50';
    const result = await db.query(query, params);
    res.json({ exercises: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
