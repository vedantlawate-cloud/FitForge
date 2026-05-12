const db = require('../config/db');

// GET /api/calories?date=YYYY-MM-DD
exports.getLogs = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT fl.id, fl.meal_type, fl.quantity_g, fl.calories, fl.notes, fl.created_at,
              f.name as food_name, f.brand, f.calories_per_serving, f.serving_size_g,
              f.protein_g, f.carbs_g, f.fat_g, f.fiber_g
       FROM food_logs fl
       JOIN foods f ON f.id = fl.food_id
       WHERE fl.user_id = $1 AND fl.logged_date = $2
       ORDER BY fl.created_at ASC`,
      [req.user.id, date]
    );
    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/calories
exports.addLog = async (req, res) => {
  try {
    const { food_id, meal_type, quantity_g, date, notes } = req.body;

    // Calculate calories based on quantity
    const foodResult = await db.query('SELECT * FROM foods WHERE id = $1', [food_id]);
    if (foodResult.rows.length === 0) return res.status(404).json({ error: 'Food not found' });

    const food = foodResult.rows[0];
    const calories = (quantity_g / food.serving_size_g) * food.calories_per_serving;

    const result = await db.query(
      `INSERT INTO food_logs (user_id, food_id, logged_date, meal_type, quantity_g, calories, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, food_id, date || new Date().toISOString().split('T')[0], meal_type, quantity_g, calories.toFixed(2), notes]
    );
    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/calories/:id
exports.deleteLog = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM food_logs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/calories/summary?date=YYYY-MM-DD
exports.getSummary = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT 
        COALESCE(SUM(fl.calories), 0) as total_calories,
        COALESCE(SUM(fl.quantity_g / f.serving_size_g * f.protein_g), 0) as total_protein,
        COALESCE(SUM(fl.quantity_g / f.serving_size_g * f.carbs_g), 0) as total_carbs,
        COALESCE(SUM(fl.quantity_g / f.serving_size_g * f.fat_g), 0) as total_fat,
        COUNT(*) as food_count
       FROM food_logs fl JOIN foods f ON f.id = fl.food_id
       WHERE fl.user_id = $1 AND fl.logged_date = $2`,
      [req.user.id, date]
    );
    res.json({ summary: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/calories/foods?q=search
exports.searchFoods = async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const result = await db.query(
      `SELECT * FROM foods WHERE name ILIKE $1 OR brand ILIKE $1 ORDER BY name LIMIT 20`,
      [q]
    );
    res.json({ foods: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/calories/water
exports.logWater = async (req, res) => {
  try {
    const { amount_ml, date } = req.body;
    const result = await db.query(
      `INSERT INTO water_logs (user_id, logged_date, amount_ml) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, date || new Date().toISOString().split('T')[0], amount_ml]
    );
    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getWaterLogs = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const result = await db.query(
      `SELECT COALESCE(SUM(amount_ml), 0) as total_ml FROM water_logs WHERE user_id = $1 AND logged_date = $2`,
      [req.user.id, date]
    );
    res.json({ total_ml: result.rows[0].total_ml });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
