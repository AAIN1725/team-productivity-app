import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'pm', inviteCode: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }); }, [isAuthenticated]);

  function validate() {
    const e = {};
    if (!form.name || form.name.trim().length < 1 || form.name.trim().length > 100) e.name = 'Name is required (max 100 chars).';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'A valid email is required.';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.role === 'developer' && (!form.inviteCode || !/^[A-Z0-9]{6}$/i.test(form.inviteCode)))
      e.inviteCode = 'Invite code must be exactly 6 alphanumeric characters.';
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
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === 'developer') payload.inviteCode = form.inviteCode.toUpperCase();
      const res = await api.post('/api/auth/register', payload);
      login(res.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) setErrors({ [data.field]: data.error });
      else setServerError(data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-sub">Team Productivity App</p>

        {serverError && <div className="form-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>I am a…</label>
            <div className="role-radio">
              {['pm', 'developer'].map(r => (
                <label key={r} className={`role-option ${form.role === r ? 'selected' : ''}`}>
                  <input type="radio" value={r} checked={form.role === r} onChange={() => setForm(f => ({ ...f, role: r, inviteCode: '' }))} />
                  <span className="role-label">{r === 'pm' ? 'Project Manager' : 'Developer'}</span>
                  <span className="role-desc">{r === 'pm' ? 'Create & manage team' : 'Join existing team'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Full name</label>
            <input type="text" className={errors.name ? 'error' : ''} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" autoFocus />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className={errors.email ? 'error' : ''} value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className={errors.password ? 'error' : ''} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          {form.role === 'developer' && (
            <div className="form-group">
              <label>Invite code</label>
              <input type="text" className={errors.inviteCode ? 'error' : ''} value={form.inviteCode}
                onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
                placeholder="6-character code from your PM" maxLength={6} />
              {errors.inviteCode && <div className="field-error">{errors.inviteCode}</div>}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
