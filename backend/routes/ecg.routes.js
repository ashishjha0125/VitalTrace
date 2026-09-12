const express = require('express');
const { uploadRecording, getRecording, getRecordingsBySession } = require('../controllers/ecg.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/upload', uploadRecording);
router.get('/:id', getRecording);
router.get('/session/:sessionId', getRecordingsBySession);

module.exports = router;
