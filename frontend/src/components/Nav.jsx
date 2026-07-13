import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav>
      <span className="nav-brand">SprintBoard</span>
      <NavLink to="/dashboard">Dashboard</NavLink>
      {user?.role === 'pm' && (
        <>
          <NavLink to="/backlog">Backlog</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/team">Team</NavLink>
        </>
      )}
      <div className="nav-spacer" />
      <span className="nav-user">{user?.name} · {user?.role === 'pm' ? 'PM' : 'Dev'}</span>
      <button className="nav-logout" onClick={handleLogout}>Sign out</button>
    </nav>
  );
}
