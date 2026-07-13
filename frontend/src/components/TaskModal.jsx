import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TaskModal({ task, members = [], onClose, onSave, onDelete, sprintId }) {
  const { user } = useAuth();
  const isCreate = !task?.id;

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', assigneeId: '',
  });
  const [editing, setEditing] = useState(isCreate);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'medium', assigneeId: task.assignee?.id || '' });
      setEditing(isCreate);
    }
  }, [task]);

  if (!task && !isCreate) return null;

  function validate() {
    const e = {};
    if (!form.title || form.title.trim().length < 1 || form.title.trim().length > 100)
      e.title = 'Title is required (max 100 chars).';
    if (form.description && form.description.length > 1000)
      e.description = 'Description max 1000 chars.';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload = { title: form.title.trim(), description: form.description || null, priority: form.priority, assigneeId: form.assigneeId || null };
      if (sprintId) payload.sprintId = sprintId;
      if (isCreate) {
        const res = await api.post('/api/tasks', payload);
        onSave(res.data.task, 'created');
      } else {
        const res = await api.patch(`/api/tasks/${task.id}`, payload);
        onSave(res.data.task, 'updated');
      }
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) setErrors({ [data.field]: data.error });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/api/tasks/${task.id}`);
      onDelete(task.id);
      onClose();
    } catch (err) {
      setErrors({ _: err.response?.data?.error || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isCreate ? 'New Task' : editing ? 'Edit Task' : 'Task Details'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {errors._ && <div className="form-error">{errors._}</div>}
          {editing ? (
            <>
              <div className="form-group">
                <label>Title</label>
                <input type="text" className={errors.title ? 'error' : ''} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus />
                {errors.title && <div className="field-error">{errors.title}</div>}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} className={errors.description ? 'error' : ''} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
                {errors.description && <div className="field-error">{errors.description}</div>}
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assignee</label>
                <select value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{task?.title}</p>
              {task?.description && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>{task.description}</p>}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <span className={`priority-badge priority-${task?.priority}`}>{task?.priority}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Assigned to: {task?.assignee?.name || 'Unassigned'}</span>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {confirmDelete ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--danger)', flex: 1 }}>Delete this task?</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loading}>Delete</button>
            </>
          ) : editing ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setErrors({}); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={handleSave} disabled={loading}>
                {loading ? 'Saving…' : isCreate ? 'Create' : 'Save'}
              </button>
            </>
          ) : (
            <>
              {user?.role === 'pm' && !task?.sprintId && (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
              )}
              {user?.role === 'pm' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
