import { useState, useEffect, useCallback } from 'react';
import Nav from '../components/Nav';
import NoSprintView from '../views/NoSprintView';
import ActiveSprintView from '../views/ActiveSprintView';
import SprintCompleteView from '../views/SprintCompleteView';
import api from '../services/api';

export default function DashboardPage() {
  const [sprint, setSprint] = useState(undefined); // undefined = loading
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setSprint(undefined);
    setError('');
    try {
      const sprintRes = await api.get('/api/sprints/active');
      const activeSprint = sprintRes.data.sprint;
      setSprint(activeSprint);
      if (activeSprint) {
        const tasksRes = await api.get(`/api/tasks/sprint/${activeSprint.id}`);
        setTasks(tasksRes.data.tasks);
      } else {
        setTasks([]);
      }
    } catch {
      setError('Failed to load dashboard. Please refresh.');
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  async function handleTaskStatusChange(taskId, newStatus) {
    const prev = tasks.find(t => t.id === taskId)?.status;
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
    } catch {
      setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: prev } : t));
    }
  }

  if (sprint === undefined) {
    return (
      <>
        <Nav />
        <div className="page-wrapper page-content"><div className="spinner" /></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Nav />
        <div className="page-wrapper page-content">
          <div className="empty-state">
            <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={fetchDashboard}>Retry</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        {!sprint && <NoSprintView />}
        {sprint?.status === 'active' && (
          <ActiveSprintView
            sprint={sprint}
            tasks={tasks}
            onTaskStatusChange={handleTaskStatusChange}
            onSprintComplete={fetchDashboard}
            onTaskUpdated={(updated) => {
              if (updated.deleted) setTasks(ts => ts.filter(t => t.id !== updated.id));
              else setTasks(ts => ts.map(t => t.id === updated.id ? updated : t));
            }}
          />
        )}
        {sprint?.status === 'completed' && !sprint.retroClosed && (
          <SprintCompleteView sprint={sprint} />
        )}
        {sprint?.retroClosed && <NoSprintView />}
      </div>
    </>
  );
}
