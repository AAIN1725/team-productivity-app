const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../app');

function makeToken(overrides = {}) {
  return jwt.sign(
    { id: 1, name: 'Test PM', email: 'pm@test.com', role: 'pm', team_id: 1, ...overrides },
    process.env.JWT_SECRET
  );
}

const pmToken = makeToken();
const devToken = makeToken({ role: 'developer' });

describe('Sprint routes — auth and validation', () => {
  describe('GET /api/sprints/active', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/sprints/active');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/sprints/history', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/sprints/history');
      expect(res.status).toBe(401);
    });

    it('returns 403 for a developer', async () => {
      const res = await request(app)
        .get('/api/sprints/history')
        .set('Authorization', `Bearer ${devToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/sprints', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).post('/api/sprints').send({ name: 'Sprint 1', endDate: '2027-01-01' });
      expect(res.status).toBe(401);
    });

    it('returns 403 for a developer', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${devToken}`)
        .send({ name: 'Sprint 1', endDate: '2027-01-01' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ endDate: '2027-01-01' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'name');
    });

    it('returns 400 when endDate is missing', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ name: 'Sprint 1' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'endDate');
    });

    it('returns 400 when endDate is in the past', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({ name: 'Sprint 1', endDate: '2020-01-01' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/sprints/:id', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).delete('/api/sprints/1');
      expect(res.status).toBe(401);
    });

    it('returns 403 for a developer', async () => {
      const res = await request(app)
        .delete('/api/sprints/1')
        .set('Authorization', `Bearer ${devToken}`);
      expect(res.status).toBe(403);
    });
  });
});
