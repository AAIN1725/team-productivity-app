const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePM = require('../middleware/requirePM');
const { getActiveSprint, getSprintHistory, createSprint, deleteSprint, completeSprint } = require('../controllers/sprint.controller');

router.get('/active', auth, getActiveSprint);
router.get('/history', auth, requirePM, getSprintHistory);
router.post('/', auth, requirePM, createSprint);
router.delete('/:id', auth, requirePM, deleteSprint);
router.patch('/:id/complete', auth, requirePM, completeSprint);

module.exports = router;
