import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav>
      <span className="nav-brand">SprintBoard</span>
      <div className={`nav-links${menuOpen ? ' open' : ''}`}>
        <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
        {user?.role === 'pm' && (
          <>
            <NavLink to="/backlog" onClick={() => setMenuOpen(false)}>Backlog</NavLink>
            <NavLink to="/history" onClick={() => setMenuOpen(false)}>History</NavLink>
            <NavLink to="/team" onClick={() => setMenuOpen(false)}>Team</NavLink>
          </>
        )}
      </div>
      <div className="nav-spacer" />
      <div className="nav-right">
        <span className="nav-user">{user?.name} · {user?.role === 'pm' ? 'PM' : 'Dev'}</span>
        <button className="nav-logout" onClick={handleLogout}>Sign out</button>
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
