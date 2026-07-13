const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePM = require('../middleware/requirePM');
const { submitRetro, getRetroStatus, getRetroResults, closeRetro } = require('../controllers/retro.controller');

router.post('/:sprintId', auth, submitRetro);
router.get('/:sprintId/status', auth, getRetroStatus);
router.get('/:sprintId/results', auth, requirePM, getRetroResults);
router.patch('/:sprintId/close', auth, requirePM, closeRetro);

module.exports = router;
