import { useState } from 'react';
import api from '../services/api';

export default function AddToSprintModal({ tasks, sprintId, onClose, onAdded }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function handleAdd() {
    setLoading(true);
    setError('');
    try {
      await Promise.all(selected.map(id => api.patch(`/api/tasks/${id}`, { sprintId })));
      onAdded();
      onClose();
    } catch {
      setError('Failed to add some tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add to Sprint</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}
          {tasks.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No backlog tasks available.</p>
            : tasks.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
                <span style={{ flex: 1 }}>{t.title}</span>
                <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
              </label>
            ))
          }
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={handleAdd}
            disabled={selected.length === 0 || loading}>
            {loading ? 'Adding…' : `Add ${selected.length || ''} task${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
