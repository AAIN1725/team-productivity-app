const pool = require('../config/db');

function formatTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    sprintId: row.sprint_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignee: row.assignee_id ? { id: row.assignee_id, name: row.assignee_name } : null,
  };
}

async function getBacklog(req, res) {
  const { teamId } = req.user;
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.team_id = $1 AND t.sprint_id IS NULL
       ORDER BY t.created_at DESC LIMIT 100`,
      [teamId]
    );
    return res.status(200).json({ tasks: result.rows.map(formatTask) });
  } catch (err) {
    console.error('getBacklog error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getSprintTasks(req, res) {
  const { teamId } = req.user;
  const { sprintId } = req.params;
  try {
    const sprintCheck = await pool.query('SELECT id FROM sprints WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
    if (sprintCheck.rows.length === 0)
      return res.status(404).json({ error: 'Sprint not found.' });

    const result = await pool.query(
      `SELECT t.*, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.sprint_id = $1 AND t.team_id = $2
       ORDER BY t.created_at ASC`,
      [sprintId, teamId]
    );
    return res.status(200).json({ tasks: result.rows.map(formatTask) });
  } catch (err) {
    console.error('getSprintTasks error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function createTask(req, res) {
  const { teamId } = req.user;
  const { title, description, assigneeId, priority = 'medium', sprintId } = req.body;

  if (!title || title.trim().length < 1 || title.trim().length > 100)
    return res.status(400).json({ error: 'Title must be between 1 and 100 characters.', field: 'title' });
  if (description && description.length > 1000)
    return res.status(400).json({ error: 'Description must be 1000 characters or fewer.', field: 'description' });
  if (!['low', 'medium', 'high'].includes(priority))
    return res.status(400).json({ error: 'Priority must be low, medium, or high.', field: 'priority' });

  try {
    let status = 'backlog';
    if (sprintId) {
      const sprintCheck = await pool.query('SELECT id FROM sprints WHERE id = $1 AND team_id = $2 AND status = $3', [sprintId, teamId, 'active']);
      if (sprintCheck.rows.length === 0)
        return res.status(404).json({ error: 'Active sprint not found.' });
      status = 'todo';
    }

    const result = await pool.query(
      `INSERT INTO tasks (team_id, sprint_id, title, description, assignee_id, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [teamId, sprintId || null, title.trim(), description || null, assigneeId || null, priority, status]
    );

    const task = result.rows[0];
    let assigneeName = null;
    if (task.assignee_id) {
      const u = await pool.query('SELECT name FROM users WHERE id = $1', [task.assignee_id]);
      assigneeName = u.rows[0]?.name || null;
    }
    task.assignee_name = assigneeName;
    return res.status(201).json({ task: formatTask(task) });
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function updateTask(req, res) {
  const { teamId } = req.user;
  const { id } = req.params;
  const { title, description, assigneeId, priority, sprintId } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1 AND team_id = $2', [id, teamId]);
    if (existing.rows.length === 0)
      return res.status(404).json({ error: 'Task not found.' });

    const task = existing.rows[0];
    const newTitle = title !== undefined ? title.trim() : task.title;
    const newDesc = description !== undefined ? description : task.description;
    const newAssignee = assigneeId !== undefined ? assigneeId : task.assignee_id;
    const newPriority = priority !== undefined ? priority : task.priority;

    let newSprintId = task.sprint_id;
    let newStatus = task.status;
    if (sprintId !== undefined) {
      if (sprintId === null) {
        newSprintId = null;
        newStatus = 'backlog';
      } else {
        const sprintCheck = await pool.query('SELECT id FROM sprints WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
        if (sprintCheck.rows.length === 0)
          return res.status(404).json({ error: 'Sprint not found.' });
        newSprintId = sprintId;
        newStatus = 'todo';
      }
    }

    if (newTitle.length < 1 || newTitle.length > 100)
      return res.status(400).json({ error: 'Title must be between 1 and 100 characters.', field: 'title' });
    if (newDesc && newDesc.length > 1000)
      return res.status(400).json({ error: 'Description must be 1000 characters or fewer.', field: 'description' });
    if (!['low', 'medium', 'high'].includes(newPriority))
      return res.status(400).json({ error: 'Priority must be low, medium, or high.', field: 'priority' });

    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, assignee_id=$3, priority=$4, sprint_id=$5, status=$6, updated_at=NOW()
       WHERE id=$7 AND team_id=$8 RETURNING *`,
      [newTitle, newDesc || null, newAssignee || null, newPriority, newSprintId, newStatus, id, teamId]
    );

    const updated = result.rows[0];
    let assigneeName = null;
    if (updated.assignee_id) {
      const u = await pool.query('SELECT name FROM users WHERE id = $1', [updated.assignee_id]);
      assigneeName = u.rows[0]?.name || null;
    }
    updated.assignee_name = assigneeName;
    return res.status(200).json({ task: formatTask(updated) });
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function updateTaskStatus(req, res) {
  const { teamId } = req.user;
  const { id } = req.params;
  const { status } = req.body;

  if (!['todo', 'in_progress', 'done'].includes(status))
    return res.status(400).json({ error: 'Status must be todo, in_progress, or done.', field: 'status' });

  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1 AND team_id = $2', [id, teamId]);
    if (taskResult.rows.length === 0)
      return res.status(404).json({ error: 'Task not found.' });

    const task = taskResult.rows[0];
    if (!task.sprint_id)
      return res.status(400).json({ error: 'Cannot change status of a backlog task. Assign it to a sprint first.' });

    const sprintResult = await pool.query('SELECT status FROM sprints WHERE id = $1', [task.sprint_id]);
    if (sprintResult.rows[0].status === 'completed')
      return res.status(403).json({ error: 'Sprint is closed. Board is locked.' });

    const result = await pool.query(
      `UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 AND team_id=$3 RETURNING id, status, updated_at`,
      [status, id, teamId]
    );
    return res.status(200).json({ task: result.rows[0] });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function deleteTask(req, res) {
  const { teamId } = req.user;
  const { id } = req.params;
  try {
    const task = await pool.query('SELECT sprint_id FROM tasks WHERE id = $1 AND team_id = $2', [id, teamId]);
    if (task.rows.length === 0)
      return res.status(404).json({ error: 'Task not found.' });
    if (task.rows[0].sprint_id)
      return res.status(409).json({ error: 'Cannot delete a task that is in a sprint.' });

    await pool.query('DELETE FROM tasks WHERE id = $1 AND team_id = $2', [id, teamId]);
    return res.status(204).send();
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { getBacklog, getSprintTasks, createTask, updateTask, updateTaskStatus, deleteTask };
