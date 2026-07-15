import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Nav from '../components/Nav';
import api from '../services/api';

const QUESTIONS = [
  'What went well this sprint?',
  "What didn't go well?",
  'What should we improve next sprint?',
];

export default function RetroFormPage() {
  const { sprintId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [doneTasks, setDoneTasks] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/retro/${sprintId}/status`),
      api.get(`/api/tasks/sprint/${sprintId}`),
    ]).then(([statusRes, tasksRes]) => {
      if (statusRes.data.submitted) setSubmitted(true);
      setDoneTasks(tasksRes.data.tasks.filter(t => t.status === 'done'));
    }).catch(() => {
      setFetchError('Could not load sprint data. Please refresh and try again.');
    }).finally(() => setChecking(false));
  }, [sprintId]);

  function validate() {
    const e = {};
    answers.forEach((a, i) => {
      if (!a || a.trim().length < 10) e[`a${i}`] = 'Answer must be at least 10 characters.';
      else if (a.trim().length > 500) e[`a${i}`] = 'Answer must be 500 characters or fewer.';
    });
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      await api.post(`/api/retro/${sprintId}`, { answer_1: answers[0], answer_2: answers[1], answer_3: answers[2] });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 409) { setSubmitted(true); return; }
      setServerError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <><Nav /><div className="page-wrapper page-content"><div className="spinner" /></div></>;
  }

  if (submitted) {
    return (
      <>
        <Nav />
        <div className="page-wrapper page-content">
          <div className="retro-submitted-state">
            <div className="check-icon">✅</div>
            <h3>Feedback submitted</h3>
            <p>Your responses have been recorded anonymously. Thank you!</p>
            {user?.role === 'pm' && (
              <button className="btn btn-primary btn-sm" style={{ width: 'auto', marginTop: 20 }}
                onClick={() => navigate(`/retro/${sprintId}/results`)}>View Results</button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        <div className="page-header"><h2>Sprint Retrospective</h2></div>

        {doneTasks.length > 0 && (
          <div className="retro-done-list card" style={{ padding: 16, marginBottom: 24 }}>
            <h4>Completed in this sprint ({doneTasks.length})</h4>
            {doneTasks.map(t => (
              <div key={t.id} className="retro-done-item">
                <span>{t.title}</span>
                <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ maxWidth: 640, padding: 32 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Your responses are anonymous — your name will never be shown alongside your answers.
          </p>
          {fetchError && <div className="form-error">{fetchError}</div>}
          {serverError && <div className="form-error">{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            {QUESTIONS.map((q, i) => (
              <div className="form-group" key={i}>
                <label className="retro-q-label">{i + 1}. {q}</label>
                <textarea rows={3} className={errors[`a${i}`] ? 'error' : ''} value={answers[i]}
                  onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
                  placeholder="Min 10 characters" />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {errors[`a${i}`] ? <div className="field-error">{errors[`a${i}`]}</div> : <span />}
                  <div className="char-count">{answers[i].length}/500</div>
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
