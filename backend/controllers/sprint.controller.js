const pool = require('../config/db');

function formatSprint(row) {
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    retroClosed: row.retro_closed,
    teamMemberCount: row.team_member_count,
    createdAt: row.created_at,
  };
}

async function getActiveSprint(req, res) {
  const { teamId } = req.user;
  try {
    const result = await pool.query(
      `SELECT * FROM sprints WHERE team_id = $1 AND status = 'active' LIMIT 1`,
      [teamId]
    );
    return res.status(200).json({ sprint: result.rows.length > 0 ? formatSprint(result.rows[0]) : null });
  } catch (err) {
    console.error('getActiveSprint error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getSprintHistory(req, res) {
  const { teamId } = req.user;
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.start_date, s.end_date, s.team_member_count,
              COUNT(t.id) AS tasks_total,
              COUNT(t.id) FILTER (WHERE t.status = 'done') AS tasks_done,
              COUNT(rs.id) AS retro_submitted
       FROM sprints s
       LEFT JOIN tasks t ON t.sprint_id = s.id
       LEFT JOIN retro_submissions rs ON rs.sprint_id = s.id
       WHERE s.team_id = $1 AND s.status = 'completed'
       GROUP BY s.id
       ORDER BY s.end_date DESC LIMIT 50`,
      [teamId]
    );
    return res.status(200).json({
      sprints: result.rows.map(r => ({
        id: r.id,
        name: r.name,
        startDate: r.start_date,
        endDate: r.end_date,
        tasksTotal: parseInt(r.tasks_total, 10),
        tasksDone: parseInt(r.tasks_done, 10),
        retroTotal: r.team_member_count,
        retroSubmitted: parseInt(r.retro_submitted, 10),
      })),
    });
  } catch (err) {
    console.error('getSprintHistory error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function createSprint(req, res) {
  const { teamId } = req.user;
  const { name, endDate, goal } = req.body;

  if (!name || name.trim().length < 1 || name.trim().length > 100)
    return res.status(400).json({ error: 'Sprint name must be between 1 and 100 characters.', field: 'name' });
  if (!endDate || isNaN(Date.parse(endDate)))
    return res.status(400).json({ error: 'A valid end date is required.', field: 'endDate' });
  if (new Date(endDate) < new Date(new Date().toDateString()))
    return res.status(400).json({ error: 'End date must be today or in the future.', field: 'endDate' });

  try {
    const activeCheck = await pool.query(
      `SELECT id FROM sprints WHERE team_id = $1 AND status = 'active'`,
      [teamId]
    );
    if (activeCheck.rows.length > 0)
      return res.status(409).json({ error: 'A sprint is already active. Complete the current sprint first.' });

    const openRetroCheck = await pool.query(
      `SELECT id FROM sprints WHERE team_id = $1 AND status = 'completed' AND retro_closed = false`,
      [teamId]
    );
    if (openRetroCheck.rows.length > 0)
      return res.status(409).json({ error: 'Close the current retrospective before starting a new sprint.' });

    const result = await pool.query(
      `INSERT INTO sprints (team_id, name, goal, start_date, end_date)
       VALUES ($1, $2, $3, CURRENT_DATE, $4) RETURNING *`,
      [teamId, name.trim(), goal || null, endDate]
    );
    return res.status(201).json({ sprint: formatSprint(result.rows[0]) });
  } catch (err) {
    console.error('createSprint error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function deleteSprint(req, res) {
  const { teamId } = req.user;
  const { id } = req.params;
  try {
    const sprint = await pool.query('SELECT id FROM sprints WHERE id = $1 AND team_id = $2', [id, teamId]);
    if (sprint.rows.length === 0)
      return res.status(404).json({ error: 'Sprint not found.' });

    const taskCount = await pool.query('SELECT COUNT(*) FROM tasks WHERE sprint_id = $1', [id]);
    if (parseInt(taskCount.rows[0].count, 10) > 0)
      return res.status(409).json({ error: 'Remove all tasks from this sprint before deleting.' });

    await pool.query('DELETE FROM sprints WHERE id = $1 AND team_id = $2', [id, teamId]);
    return res.status(204).send();
  } catch (err) {
    console.error('deleteSprint error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function completeSprint(req, res) {
  const { teamId } = req.user;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    const sprintResult = await client.query('SELECT * FROM sprints WHERE id = $1 AND team_id = $2', [id, teamId]);
    if (sprintResult.rows.length === 0)
      return res.status(404).json({ error: 'Sprint not found.' });
    if (sprintResult.rows[0].status === 'completed')
      return res.status(409).json({ error: 'This sprint is already completed.' });

    const countResult = await client.query('SELECT COUNT(*) FROM users WHERE team_id = $1', [teamId]);
    const memberCount = parseInt(countResult.rows[0].count, 10);

    await client.query('BEGIN');

    await client.query(
      `UPDATE sprints SET status = 'completed', team_member_count = $1 WHERE id = $2 AND team_id = $3`,
      [memberCount, id, teamId]
    );

    const returnedResult = await client.query(
      `UPDATE tasks SET status = 'backlog', sprint_id = NULL, updated_at = NOW()
       WHERE sprint_id = $1 AND status IN ('todo', 'in_progress')
       RETURNING id`,
      [id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      sprint: { id, status: 'completed' },
      tasksReturned: returnedResult.rows.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('completeSprint error:', err);
    return res.status(500).json({ error: 'Failed to complete sprint. Please try again.' });
  } finally {
    client.release();
  }
}

module.exports = { getActiveSprint, getSprintHistory, createSprint, deleteSprint, completeSprint };
