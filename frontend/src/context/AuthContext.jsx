import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(stored);
          setUser({ id: payload.id, name: payload.name, email: payload.email, role: payload.role, teamId: payload.team_id });
        } else {
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
    setAuthLoading(false);
  }, []);

  function login(newToken) {
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setToken(newToken);
      setUser({ id: payload.id, name: payload.name, email: payload.email, role: payload.role, teamId: payload.team_id });
      localStorage.setItem('token', newToken);
    } catch {
      localStorage.removeItem('token');
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
