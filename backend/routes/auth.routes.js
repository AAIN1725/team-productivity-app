const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const { registerPM, registerDeveloper, login } = require('../controllers/auth.controller');

router.post('/register', (req, res) => {
  if (req.body.role === 'pm') return registerPM(req, res);
  if (req.body.role === 'developer') return registerDeveloper(req, res);
  return res.status(400).json({ error: 'Role must be pm or developer.', field: 'role' });
});

router.post('/login', loginLimiter, login);

module.exports = router;
