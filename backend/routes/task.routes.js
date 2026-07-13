const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requirePM = require('../middleware/requirePM');
const { getBacklog, getSprintTasks, createTask, updateTask, updateTaskStatus, deleteTask } = require('../controllers/task.controller');

router.get('/backlog', auth, getBacklog);
router.get('/sprint/:sprintId', auth, getSprintTasks);
router.post('/', auth, requirePM, createTask);
router.patch('/:id', auth, requirePM, updateTask);
router.patch('/:id/status', auth, updateTaskStatus);
router.delete('/:id', auth, requirePM, deleteTask);

module.exports = router;
