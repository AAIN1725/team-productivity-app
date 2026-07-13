const pool = require('../config/db');

async function submitRetro(req, res) {
  const { teamId, id: userId } = req.user;
  const { sprintId } = req.params;
  const { answer_1, answer_2, answer_3 } = req.body;

  const sprint = await pool.query('SELECT * FROM sprints WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
  if (sprint.rows.length === 0)
    return res.status(404).json({ error: 'Sprint not found.' });
  if (sprint.rows[0].status !== 'completed')
    return res.status(403).json({ error: 'Retrospective is not open yet. The sprint must be completed first.' });

  if (!answer_1 || answer_1.trim().length < 10 || answer_1.trim().length > 500)
    return res.status(400).json({ error: 'Answer must be between 10 and 500 characters.', field: 'answer_1' });
  if (!answer_2 || answer_2.trim().length < 10 || answer_2.trim().length > 500)
    return res.status(400).json({ error: 'Answer must be between 10 and 500 characters.', field: 'answer_2' });
  if (!answer_3 || answer_3.trim().length < 10 || answer_3.trim().length > 500)
    return res.status(400).json({ error: 'Answer must be between 10 and 500 characters.', field: 'answer_3' });

  try {
    await pool.query(
      `INSERT INTO retro_submissions (sprint_id, user_id, answer_1, answer_2, answer_3)
       VALUES ($1, $2, $3, $4, $5)`,
      [sprintId, userId, answer_1.trim(), answer_2.trim(), answer_3.trim()]
    );
    return res.status(201).json({ message: 'Submission recorded.' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'You have already submitted feedback for this sprint.' });
    console.error('submitRetro error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getRetroStatus(req, res) {
  const { id: userId, teamId } = req.user;
  const { sprintId } = req.params;
  try {
    const sprintCheck = await pool.query('SELECT id FROM sprints WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
    if (sprintCheck.rows.length === 0)
      return res.status(404).json({ error: 'Sprint not found.' });

    const result = await pool.query(
      'SELECT COUNT(*) FROM retro_submissions WHERE sprint_id = $1 AND user_id = $2',
      [sprintId, userId]
    );
    return res.status(200).json({ submitted: parseInt(result.rows[0].count, 10) > 0 });
  } catch (err) {
    console.error('getRetroStatus error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getRetroResults(req, res) {
  const { teamId } = req.user;
  const { sprintId } = req.params;
  try {
    const sprintResult = await pool.query('SELECT * FROM sprints WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
    if (sprintResult.rows.length === 0)
      return res.status(404).json({ error: 'Sprint not found.' });
    const sprint = sprintResult.rows[0];

    const submittedResult = await pool.query(
      'SELECT COUNT(DISTINCT user_id) AS submitted FROM retro_submissions WHERE sprint_id = $1',
      [sprintId]
    );

    const tasksResult = await pool.query(
      `SELECT t.id, t.title, t.priority, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.sprint_id = $1 AND t.status = 'done'`,
      [sprintId]
    );

    // Explicitly exclude user_id from the SELECT
    const responsesResult = await pool.query(
      'SELECT answer_1, answer_2, answer_3 FROM retro_submissions WHERE sprint_id = $1',
      [sprintId]
    );

    return res.status(200).json({
      sprint: { id: sprint.id, name: sprint.name, retroClosed: sprint.retro_closed },
      participation: {
        submitted: parseInt(submittedResult.rows[0].submitted, 10),
        total: sprint.team_member_count,
      },
      tasks: tasksResult.rows.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        assignee: t.assignee_name ? { name: t.assignee_name } : null,
      })),
      responses: {
        question1: responsesResult.rows.map(r => r.answer_1),
        question2: responsesResult.rows.map(r => r.answer_2),
        question3: responsesResult.rows.map(r => r.answer_3),
      },
    });
  } catch (err) {
    console.error('getRetroResults error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function closeRetro(req, res) {
  const { teamId } = req.user;
  const { sprintId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM sprints WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Sprint not found.' });
    if (result.rows[0].retro_closed)
      return res.status(409).json({ error: 'Retrospective is already closed.' });

    await pool.query('UPDATE sprints SET retro_closed = true WHERE id = $1 AND team_id = $2', [sprintId, teamId]);
    return res.status(200).json({ message: 'Retrospective closed.' });
  } catch (err) {
    console.error('closeRetro error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { submitRetro, getRetroStatus, getRetroResults, closeRetro };
