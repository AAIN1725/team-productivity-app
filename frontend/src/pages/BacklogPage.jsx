import { useState, useEffect, useCallback } from 'react';
import Nav from '../components/Nav';
import TaskModal from '../components/TaskModal';
import AddToSprintModal from '../components/AddToSprintModal';
import api from '../services/api';

export default function BacklogPage() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showAddSprint, setShowAddSprint] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksRes, teamRes, sprintRes] = await Promise.all([
        api.get('/api/tasks/backlog'),
        api.get('/api/team'),
        api.get('/api/sprints/active'),
      ]);
      setTasks(tasksRes.data.tasks);
      setMembers(teamRes.data.members);
      setActiveSprint(sprintRes.data.sprint);
    } catch {
      setError('Could not load backlog. Please refresh.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function handleSave(task, action) {
    if (action === 'created') setTasks(ts => [task, ...ts]);
    else setTasks(ts => ts.map(t => t.id === task.id ? task : t));
  }

  function handleDelete(id) {
    setTasks(ts => ts.filter(t => t.id !== id));
  }

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        <div className="page-header">
          <h2>Backlog <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({tasks.length})</span></h2>
          <div className="page-header-actions">
            {activeSprint && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSprint(true)}>
                + Add to Sprint
              </button>
            )}
            <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
              + New Task
            </button>
          </div>
        </div>

        {error && (
          <div className="empty-state">
            <div className="form-error" style={{ maxWidth: 400, margin: '0 auto 16px' }}>{error}</div>
            <button className="btn btn-secondary btn-sm" onClick={fetch}>Try Again</button>
          </div>
        )}
        {loading ? <div className="spinner" /> : error ? null : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Backlog is empty</h3>
            <p>Create a task to get started.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><span className={`priority-badge priority-${t.priority}`}>{t.priority}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.assignee?.name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="task-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditTask(t)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <TaskModal task={{}} members={members} onClose={() => setShowCreate(false)}
          onSave={handleSave} onDelete={handleDelete} />
      )}
      {editTask && (
        <TaskModal task={editTask} members={members} onClose={() => setEditTask(null)}
          onSave={handleSave} onDelete={handleDelete} />
      )}
      {showAddSprint && activeSprint && (
        <AddToSprintModal tasks={tasks} sprintId={activeSprint.id}
          onClose={() => setShowAddSprint(false)} onAdded={fetch} />
      )}
    </>
  );
}
