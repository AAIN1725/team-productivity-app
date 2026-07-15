const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');

describe('auth middleware', () => {
  let res;
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  });

  it('returns 401 when Authorization header is absent', () => {
    auth({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    auth({ headers: { authorization: 'Basic abc123' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a malformed token', () => {
    auth({ headers: { authorization: 'Bearer not.a.real.token' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ id: 1 }, 'wrong-secret');
    auth({ headers: { authorization: `Bearer ${token}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next() with a valid token', () => {
    const payload = { id: 5, name: 'Alice', email: 'alice@test.com', role: 'pm', team_id: 2 };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    auth(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 5, name: 'Alice', role: 'pm', teamId: 2 });
  });

  it('maps token team_id to req.user.teamId (not team_id)', () => {
    const token = jwt.sign({ id: 7, name: 'Bob', email: 'b@test.com', role: 'developer', team_id: 99 }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    auth(req, res, next);
    expect(req.user.teamId).toBe(99);
    expect(req.user.team_id).toBeUndefined();
  });
});
