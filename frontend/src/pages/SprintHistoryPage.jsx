import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import api from '../services/api';

export default function SprintHistoryPage() {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    setError('');
    api.get('/api/sprints/history')
      .then(r => setSprints(r.data.sprints))
      .catch(() => setError('Could not load sprint history. Please refresh.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        <div className="page-header"><h2>Sprint History</h2></div>

        {loading ? <div className="spinner" /> : error ? (
          <div className="empty-state">
            <p className="form-error" style={{ maxWidth: 400, margin: '0 auto 16px' }}>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={load}>Try Again</button>
          </div>
        ) : sprints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No completed sprints yet</h3>
            <p>Completed sprints will appear here.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Sprint</th>
                  <th>Dates</th>
                  <th>Tasks Done</th>
                  <th>Retro</th>
                </tr>
              </thead>
              <tbody>
                {sprints.map(s => (
                  <tr key={s.id} onClick={() => navigate(`/retro/${s.id}/results`)}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                    </td>
                    <td>{s.tasksDone}/{s.tasksTotal}</td>
                    <td>{s.retroSubmitted}/{s.retroTotal} responded</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
