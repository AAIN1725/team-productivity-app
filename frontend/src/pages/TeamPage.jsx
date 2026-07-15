import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import api from '../services/api';

export default function TeamPage() {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    Promise.all([api.get('/api/team'), api.get('/api/team/invite-code')])
      .then(([teamRes, codeRes]) => {
        setTeam(teamRes.data.team);
        setMembers(teamRes.data.members);
        setInviteCode(codeRes.data.inviteCode);
      })
      .catch(() => setError('Could not load team data. Please refresh.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <Nav />
      <div className="page-wrapper page-content">
        <div className="page-header"><h2>{team?.name || 'Team'}</h2></div>

        {loading ? <div className="spinner" /> : error ? (
          <div className="empty-state">
            <p className="form-error" style={{ maxWidth: 400, margin: '0 auto 16px' }}>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={load}>Try Again</button>
          </div>
        ) : (
          <>
            <div className="invite-box">
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Team Invite Code
                </div>
                <div className="invite-code">{inviteCode}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Share this with developers to join your team
                </div>
              </div>
              <div>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="card">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ flexShrink: 0 }}>
                            {m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          {m.name}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: m.role === 'pm' ? 'var(--primary-light)' : 'var(--bg)',
                          color: m.role === 'pm' ? 'var(--primary)' : 'var(--text-muted)',
                          border: '1px solid var(--border)' }}>
                          {m.role === 'pm' ? 'Project Manager' : 'Developer'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
