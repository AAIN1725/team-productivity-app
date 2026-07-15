const request = require('supertest');
const app = require('../../app');

describe('Auth routes', () => {
  it('GET /api/health returns { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  describe('POST /api/auth/register — validation', () => {
    it('returns 400 when role is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'role');
    });

    it('returns 400 for an invalid email (PM registration)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test PM', email: 'bademail', password: 'password123', role: 'pm' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'email');
    });

    it('returns 400 when password is too short (developer registration)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Dev', email: 'dev@test.com', password: 'short', role: 'developer', inviteCode: 'ABC123' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'password');
    });

    it('returns 400 for invalid invite code format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Dev', email: 'dev@test.com', password: 'password123', role: 'developer', inviteCode: 'bad!' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('field', 'inviteCode');
    });
  });

  describe('POST /api/auth/login — validation', () => {
    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when only email is provided', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });
});
