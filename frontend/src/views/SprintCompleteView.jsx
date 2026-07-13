import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SprintCompleteView({ sprint }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doneTasks, setDoneTasks] = useState([]);

  useEffect(() => {
    if (!sprint) return;
    api.get(`/api/tasks/sprint/${sprint.id}`)
      .then(res => setDoneTasks(res.data.tasks.filter(t => t.status === 'done')))
      .catch(() => {});
  }, [sprint?.id]);

  return (
    <div>
      <div className="sprint-complete-banner">
        <div>
          <h3>✓ {sprint?.name} is complete</h3>
          <p>The sprint board is locked. Share your retrospective feedback below.</p>
          <div className="banner-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/retro/${sprint?.id}`)}>
              Submit Feedback
            </button>
            {user?.role === 'pm' && (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/retro/${sprint?.id}/results`)}>
                View Results
              </button>
            )}
          </div>
        </div>
      </div>

      {doneTasks.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Completed in this sprint ({doneTasks.length})</h4>
          {doneTasks.map(t => (
            <div key={t.id} className="retro-done-item">
              <span>{t.title}</span>
              <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
