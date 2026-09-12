const express = require('express');
const { getAIInsights } = require('../controllers/analysis.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/ai-insights', getAIInsights);

module.exports = router;
