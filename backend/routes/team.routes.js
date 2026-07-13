const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePM = require('../middleware/requirePM');
const { getTeam, getInviteCode } = require('../controllers/team.controller');

router.get('/', auth, getTeam);
router.get('/invite-code', auth, requirePM, getInviteCode);

module.exports = router;
