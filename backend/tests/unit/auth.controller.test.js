const { login, registerPM } = require('../../controllers/auth.controller');

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('auth controller — input validation', () => {
  describe('login', () => {
    it('returns 400 when email is missing', async () => {
      const res = makeRes();
      await login({ body: { password: 'pass' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = makeRes();
      await login({ body: { email: 'user@test.com' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when both fields are missing', async () => {
      const res = makeRes();
      await login({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('registerPM', () => {
    it('returns 400 when name is empty', async () => {
      const res = makeRes();
      await registerPM({ body: { name: '', email: 'test@test.com', password: 'password123' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'name' }));
    });

    it('returns 400 when name exceeds 100 chars', async () => {
      const res = makeRes();
      await registerPM({ body: { name: 'x'.repeat(101), email: 'test@test.com', password: 'password123' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'name' }));
    });

    it('returns 400 for an invalid email format', async () => {
      const res = makeRes();
      await registerPM({ body: { name: 'Alice', email: 'notanemail', password: 'password123' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'email' }));
    });

    it('returns 400 when password is too short', async () => {
      const res = makeRes();
      await registerPM({ body: { name: 'Alice', email: 'alice@test.com', password: 'short' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'password' }));
    });

    it('returns 400 when password exceeds 128 chars', async () => {
      const res = makeRes();
      await registerPM({ body: { name: 'Alice', email: 'alice@test.com', password: 'x'.repeat(129) } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'password' }));
    });
  });
});
