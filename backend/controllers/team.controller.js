const pool = require('../config/db');

async function getTeam(req, res) {
  const { teamId } = req.user;
  try {
    const teamResult = await pool.query(
      'SELECT id, name, created_at FROM teams WHERE id = $1',
      [teamId]
    );
    if (teamResult.rows.length === 0)
      return res.status(404).json({ error: 'Team not found.' });

    const membersResult = await pool.query(
      'SELECT id, name, role, created_at FROM users WHERE team_id = $1 ORDER BY created_at ASC',
      [teamId]
    );

    const team = teamResult.rows[0];
    return res.status(200).json({
      team: { id: team.id, name: team.name, createdAt: team.created_at },
      members: membersResult.rows.map(m => ({ id: m.id, name: m.name, role: m.role, createdAt: m.created_at })),
    });
  } catch (err) {
    console.error('getTeam error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getInviteCode(req, res) {
  const { teamId } = req.user;
  try {
    const result = await pool.query('SELECT invite_code FROM teams WHERE id = $1', [teamId]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Team not found.' });
    return res.status(200).json({ inviteCode: result.rows[0].invite_code });
  } catch (err) {
    console.error('getInviteCode error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { getTeam, getInviteCode };
