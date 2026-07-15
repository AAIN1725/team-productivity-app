const { getBacklog, createTask, updateTaskStatus, deleteTask } = require('../../controllers/task.controller');

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('task controller — input validation', () => {
  describe('createTask', () => {
    it('returns 400 when title is empty', async () => {
      const res = makeRes();
      await createTask({ user: { teamId: 10 }, body: { title: '', priority: 'medium' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'title' }));
    });

    it('returns 400 when title exceeds 100 chars', async () => {
      const res = makeRes();
      await createTask({ user: { teamId: 10 }, body: { title: 'x'.repeat(101), priority: 'medium' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'title' }));
    });

    it('returns 400 for an invalid priority value', async () => {
      const res = makeRes();
      await createTask({ user: { teamId: 10 }, body: { title: 'Valid title', priority: 'critical' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'priority' }));
    });
  });

  describe('updateTaskStatus', () => {
    it('returns 400 for an invalid status value', async () => {
      const res = makeRes();
      await updateTaskStatus({ user: { teamId: 10 }, params: { id: '1' }, body: { status: 'invalid' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ field: 'status' }));
    });

    it('returns 400 for all known invalid status strings', async () => {
      for (const bad of ['started', 'backlog', 'pending', 'complete']) {
        const res = makeRes();
        await updateTaskStatus({ user: { teamId: 10 }, params: { id: '1' }, body: { status: bad } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });
});
