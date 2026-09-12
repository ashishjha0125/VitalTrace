const express = require('express');
const { createSession, getSessions, getSession, deleteSession } = require('../controllers/session.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.delete('/:id', deleteSession);

module.exports = router;
