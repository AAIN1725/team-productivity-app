import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import api from '../services/api';

export default function ActiveSprintView({ sprint, tasks, onTaskStatusChange, onSprintComplete, onTaskUpdated }) {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get('/api/team').then(r => setMembers(r.data.members)).catch(() => {});
  }, []);

  const incompleteCount = tasks.filter(t => t.status !== 'done').length;

  async function handleComplete() {
    setCompleting(true);
    setCompleteError('');
    try {
      await api.patch(`/api/sprints/${sprint.id}/complete`);
      setShowConfirm(false);
      onSprintComplete();
    } catch (err) {
      if (err.response?.status === 409) {
        setShowConfirm(false);
        onSprintComplete();
      } else {
        setCompleteError('Could not complete the sprint. Please try again.');
      }
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div>
      <div className="sprint-info">
        <div>
          <h3>{sprint.name}</h3>
          <div className="sprint-dates">
            {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'} →{' '}
            {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
            {sprint.goal && <span style={{ marginLeft: 12, opacity: 0.75 }}>{sprint.goal}</span>}
          </div>
        </div>
        {user?.role === 'pm' && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(true)}>
            Complete Sprint
          </button>
        )}
      </div>

      <KanbanBoard tasks={tasks} onStatusChange={onTaskStatusChange} locked={false} onCardClick={setSelectedTask} />
      {selectedTask && (
        <TaskModal task={selectedTask} members={members} onClose={() => setSelectedTask(null)}
          onSave={(updated) => { onTaskUpdated && onTaskUpdated(updated); setSelectedTask(null); }}
          onDelete={(id) => { onTaskUpdated && onTaskUpdated({ id, deleted: true }); setSelectedTask(null); }} />
      )}

      {showConfirm && (
        <div className="modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Sprint?</h3>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="confirm-warning">
                {incompleteCount > 0 ? (
                  <><strong>{incompleteCount} task{incompleteCount !== 1 ? 's' : ''}</strong> {incompleteCount !== 1 ? 'are' : 'is'} still incomplete and will return to the backlog. This cannot be undone.</>
                ) : (
                  <>All tasks are complete. Ready to close this sprint?</>
                )}
              </p>
              {completeError && <div className="form-error" style={{ marginTop: 12 }}>{completeError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={handleComplete} disabled={completing}>
                {completing ? 'Completing…' : 'Complete Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
