const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../app');

function makeToken(overrides = {}) {
  return jwt.sign(
    { id: 1, name: 'Test PM', email: 'pm@test.com', role: 'pm', team_id: 1, ...overrides },
    process.env.JWT_SECRET
  );
}

describe('Task routes — auth and validation', () => {
  describe('GET /api/tasks/backlog', () => {
    it('returns 401 without an auth token', async () => {
      const res = await request(app).get('/api/tasks/backlog');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/tasks', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'Task', priority: 'medium' });
      expect(res.status).toBe(401);
    });

    it('returns 403 when a developer tries to create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${makeToken({ role: 'developer' })}`)
        .send({ title: 'New task', priority: 'medium' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ priority: 'medium' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'title');
    });

    it('returns 400 for an invalid priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ title: 'Task', priority: 'critical' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).patch('/api/tasks/1/status').send({ status: 'in_progress' });
      expect(res.status).toBe(401);
    });

    it('returns 400 for an invalid status value', async () => {
      const res = await request(app)
        .patch('/api/tasks/1/status')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ status: 'started' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'status');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).delete('/api/tasks/1');
      expect(res.status).toBe(401);
    });

    it('returns 403 when a developer tries to delete a task', async () => {
      const res = await request(app)
        .delete('/api/tasks/1')
        .set('Authorization', `Bearer ${makeToken({ role: 'developer' })}`);
      expect(res.status).toBe(403);
    });
  });
});
