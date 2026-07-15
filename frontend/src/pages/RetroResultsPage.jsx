import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import api from '../services/api';

const QUESTIONS = [
  'What went well this sprint?',
  "What didn't go well?",
  'What should we improve next sprint?',
];

export default function RetroResultsPage() {
  const { sprintId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [closed, setClosed] = useState(false);

  function load() {
    setLoading(true);
    setFetchError('');
    api.get(`/api/retro/${sprintId}/results`)
      .then(r => setData(r.data))
      .catch((err) => {
        if (err.response?.status === 404) setData(null);
        else setFetchError('Could not load retrospective results. Please refresh.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [sprintId]);

  async function handleClose() {
    setClosing(true);
    setCloseError('');
    try {
      await api.patch(`/api/retro/${sprintId}/close`);
      setClosed(true);
      setData(d => ({ ...d, sprint: { ...d.sprint, retroClosed: true } }));
    } catch {
      setCloseError('Could not close the retrospective. Please try again.');
    } finally { setClosing(false); }
  }

  if (loading) return <><Nav /><div className="page-wrapper page-content"><div className="spinner" /></div></>;

  if (fetchError) return (
    <><Nav /><div className="page-wrapper page-content">
      <div className="empty-state">
        <p className="form-error" style={{ maxWidth: 400, margin: '0 auto 16px' }}>{fetchError}</p>
        <button className="btn btn-secondary btn-sm" onClick={load}>Try Again</button>
      </div>
    </div></>
  );

  if (!data) return <><Nav /><div className="page-wrapper page-content"><div className="empty-state"><h3>Results not found.</h3></div></div></>;

  const { sprint, participation, tasks, responses } = data;

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        <div className="page-header">
          <div>
            <h2>{sprint.name} — Retrospective</h2>
          </div>
          {!sprint.retroClosed && !closed && (
            <button className="btn btn-danger btn-sm" onClick={handleClose} disabled={closing}>
              {closing ? 'Closing…' : 'Close Retro'}
            </button>
          )}
        </div>

        {closed && (
          <div className="form-success" style={{ marginBottom: 20 }}>
            Retrospective closed. <button className="btn btn-primary btn-sm" style={{ width: 'auto', marginLeft: 12 }}
              onClick={() => navigate('/sprint/new')}>Create New Sprint</button>
          </div>
        )}
        {closeError && <div className="form-error" style={{ marginBottom: 20 }}>{closeError}</div>}

        <div className="participation-bar">
          {participation.submitted} of {participation.total} team members responded
        </div>

        <div className="retro-results-grid">
          <div className="retro-results-section">
            <h4>Completed Tasks ({tasks.length})</h4>
            {tasks.length === 0
              ? <div className="empty-state" style={{ padding: 20 }}><p>No tasks were completed.</p></div>
              : tasks.map(t => (
                <div key={t.id} className="retro-done-item">
                  <span>{t.title}</span>
                  <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
                </div>
              ))
            }
          </div>

          <div className="retro-results-section">
            <h4>Anonymous Responses</h4>
            {[responses.question1, responses.question2, responses.question3].map((answers, i) => (
              <div key={i} className="retro-response-group">
                <div className="retro-question">{i + 1}. {QUESTIONS[i]}</div>
                {answers.length === 0
                  ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No responses yet.</div>
                  : answers.map((a, j) => <div key={j} className="retro-answer">{a}</div>)
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
