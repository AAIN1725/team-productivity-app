import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NoSprintView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="no-sprint-view">
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h3>No active sprint</h3>
      <p>
        {user?.role === 'pm'
          ? 'Create a sprint to get your team moving.'
          : 'Your Project Manager hasn\'t started a sprint yet.'}
      </p>
      {user?.role === 'pm' && (
        <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/sprint/new')}>
          Create Sprint
        </button>
      )}
    </div>
  );
}
