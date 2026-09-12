const express = require('express');
const { register, login, githubAuth, getMe } = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/github', authLimiter, githubAuth);
router.get('/me', auth, getMe);

module.exports = router;
