import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import api from '../services/api';

export default function SprintCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', endDate: '', goal: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.name || form.name.trim().length < 1 || form.name.trim().length > 100)
      e.name = 'Sprint name is required (max 100 chars).';
    if (!form.endDate) {
      e.endDate = 'End date is required.';
    } else if (new Date(form.endDate) < new Date(new Date().toDateString())) {
      e.endDate = 'End date must be today or in the future.';
    }
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
      await api.post('/api/sprints', { name: form.name.trim(), endDate: form.endDate, goal: form.goal || null });
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) setErrors({ [data.field]: data.error });
      else setServerError(data?.error || 'Failed to create sprint.');
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        <div className="page-header">
          <h2>Create Sprint</h2>
        </div>
        <div className="card" style={{ maxWidth: 520, padding: 32 }}>
          {serverError && <div className="form-error">{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Sprint name</label>
              <input type="text" className={errors.name ? 'error' : ''} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sprint 1" autoFocus />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label>End date</label>
              <input type="date" className={errors.endDate ? 'error' : ''} value={form.endDate}
                min={today} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              {errors.endDate && <div className="field-error">{errors.endDate}</div>}
            </div>
            <div className="form-group">
              <label>Goal <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea rows={3} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="What does this sprint aim to achieve?" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'auto' }} disabled={loading}>
                {loading ? 'Creating…' : 'Create Sprint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
