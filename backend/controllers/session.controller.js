const db = require('../config/db');
const { sessionSchema } = require('../utils/validators');

const createSession = async (req, res, next) => {
  try {
    const { error, value } = sessionSchema.validate(req.body);
    if (error) return next(error);

    const { startTime, duration, avgBpm, totalSamples, quality } = value;

    const result = await db.query(
      'INSERT INTO sessions (user_id, start_time, duration, avg_bpm, total_samples, quality) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, startTime, duration, avgBpm, totalSamples, quality]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not authorized' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { createSession, getSessions, getSession, deleteSession };
