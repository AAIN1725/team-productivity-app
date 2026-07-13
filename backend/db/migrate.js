require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');

    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         VARCHAR(100) NOT NULL,
        invite_code  CHAR(6) UNIQUE NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ teams');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name           VARCHAR(100) NOT NULL,
        email          VARCHAR(255) UNIQUE NOT NULL,
        password_hash  TEXT NOT NULL,
        role           VARCHAR(20) NOT NULL CHECK (role IN ('pm', 'developer')),
        team_id        UUID REFERENCES teams(id),
        created_at     TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id            UUID NOT NULL REFERENCES teams(id),
        name               VARCHAR(100) NOT NULL,
        goal               TEXT,
        start_date         DATE NOT NULL,
        end_date           DATE NOT NULL,
        status             VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
        retro_closed       BOOLEAN DEFAULT FALSE,
        team_member_count  INTEGER NOT NULL DEFAULT 0,
        created_at         TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sprints_team_status ON sprints(team_id, status)
    `);
    console.log('✓ sprints');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id      UUID NOT NULL REFERENCES teams(id),
        sprint_id    UUID REFERENCES sprints(id),
        title        VARCHAR(100) NOT NULL,
        description  TEXT,
        assignee_id  UUID REFERENCES users(id),
        priority     VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        status       VARCHAR(20) DEFAULT 'backlog'
                     CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')),
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id)
    `);
    console.log('✓ tasks');

    await client.query(`
      CREATE TABLE IF NOT EXISTS retro_submissions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sprint_id     UUID NOT NULL REFERENCES sprints(id),
        user_id       UUID NOT NULL REFERENCES users(id),
        answer_1      TEXT NOT NULL,
        answer_2      TEXT NOT NULL,
        answer_3      TEXT NOT NULL,
        submitted_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE (sprint_id, user_id)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_retro_sprint_id ON retro_submissions(sprint_id)
    `);
    console.log('✓ retro_submissions');

    console.log('\nAll migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
