const db = require('../config/db');
const { profileSchema } = require('../utils/validators');

const getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, avatar_url, age, medical_history, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { error, value } = profileSchema.validate(req.body);
    if (error) return next(error);

    const { name, age, medicalHistory } = value;

    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), age = COALESCE($2, age), medical_history = COALESCE($3, medical_history), updated_at = NOW() WHERE id = $4 RETURNING id, name, email, age, medical_history',
      [name, age, medicalHistory, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
