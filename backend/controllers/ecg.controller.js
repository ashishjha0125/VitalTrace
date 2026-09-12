const db = require('../config/db');
const { ecgSchema } = require('../utils/validators');

const uploadRecording = async (req, res, next) => {
  try {
    const { error, value } = ecgSchema.validate(req.body);
    if (error) return next(error);

    const { sessionId, data, sampleRate, duration } = value;

    // Verify session belongs to user
    const sessionCheck = await db.query(
      'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Session not found or unauthorized' });
    }

    const result = await db.query(
      'INSERT INTO ecg_recordings (user_id, session_id, data_points, sample_rate, duration_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING id, session_id, sample_rate, duration_seconds, created_at',
      [req.user.id, sessionId, JSON.stringify(data), sampleRate, duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getRecording = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM ecg_recordings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getRecordingsBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      'SELECT id, session_id, sample_rate, duration_seconds, created_at FROM ecg_recordings WHERE session_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [sessionId, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadRecording, getRecording, getRecordingsBySession };
