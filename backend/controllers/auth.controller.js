const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, team_id: user.team_id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function registerPM(req, res) {
  const { name, email, password } = req.body;

  if (!name || name.trim().length < 1 || name.trim().length > 100)
    return res.status(400).json({ error: 'Name must be between 1 and 100 characters.', field: 'name' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'A valid email is required.', field: 'email' });
  if (!password || password.length < 8 || password.length > 128)
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters.', field: 'password' });

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'An account with this email already exists.' });

    const inviteCode = generateInviteCode();
    const hash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    const teamResult = await client.query(
      `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
      [`${name.trim()}'s Team`, inviteCode]
    );
    const teamId = teamResult.rows[0].id;
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, team_id) VALUES ($1, $2, $3, 'pm', $4) RETURNING id, name, email, role, team_id`,
      [name.trim(), email.toLowerCase(), hash, teamId]
    );
    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.team_id } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('registerPM error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    client.release();
  }
}

async function registerDeveloper(req, res) {
  const { name, email, password, inviteCode } = req.body;

  if (!name || name.trim().length < 1 || name.trim().length > 100)
    return res.status(400).json({ error: 'Name must be between 1 and 100 characters.', field: 'name' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'A valid email is required.', field: 'email' });
  if (!password || password.length < 8 || password.length > 128)
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters.', field: 'password' });
  if (!inviteCode || !/^[A-Z0-9]{6}$/i.test(inviteCode))
    return res.status(400).json({ error: 'Invite code must be 6 alphanumeric characters.', field: 'inviteCode' });

  const client = await pool.connect();
  try {
    const teamResult = await client.query('SELECT id FROM teams WHERE invite_code = $1', [inviteCode.toUpperCase()]);
    if (teamResult.rows.length === 0)
      return res.status(400).json({ error: 'Invalid invite code. Please check with your Project Manager.', field: 'inviteCode' });

    const teamId = teamResult.rows[0].id;
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, team_id) VALUES ($1, $2, $3, 'developer', $4) RETURNING id, name, email, role, team_id`,
      [name.trim(), email.toLowerCase(), hash, teamId]
    );

    const user = userResult.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.team_id } });
  } catch (err) {
    console.error('registerDeveloper error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.team_id } });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { registerPM, registerDeveloper, login };
