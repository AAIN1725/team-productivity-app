const requirePM = require('../../middleware/requirePM');

describe('requirePM middleware', () => {
  let res;
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  });

  it('returns 403 when user role is developer', () => {
    requirePM({ user: { role: 'developer' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user has no role', () => {
    requirePM({ user: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user role is pm', () => {
    requirePM({ user: { role: 'pm' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
