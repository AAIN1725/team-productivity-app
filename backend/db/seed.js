require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding test data...');

    const teamResult = await client.query(
      `INSERT INTO teams (name, invite_code) VALUES ($1, $2)
       ON CONFLICT (invite_code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Test Team', 'ABC123']
    );
    const teamId = teamResult.rows[0].id;
    console.log('✓ team:', teamId);

    const pmHash = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, team_id) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['Test PM', 'pm@test.com', pmHash, 'pm', teamId]
    );
    console.log('✓ PM: pm@test.com / password123');

    const devHash = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, team_id) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['Test Dev', 'dev@test.com', devHash, 'developer', teamId]
    );
    console.log('✓ Developer: dev@test.com / password123');
    console.log('\nSeed complete. Invite code: ABC123');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
