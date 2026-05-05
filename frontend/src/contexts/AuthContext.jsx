import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const ws = JSON.parse(localStorage.getItem('workspace') || 'null');
      if (ws) api.defaults.headers.common['x-workspace-id'] = ws.id;

      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.user);
          setWorkspace(ws || data.workspaces?.[0] || null);
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('workspace', JSON.stringify(data.workspace));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    api.defaults.headers.common['x-workspace-id'] = data.workspace?.id;
    setUser(data.user);
    setWorkspace(data.workspace);
    return data;
  };

  const register = async (full_name, email, password) => {
    const { data } = await api.post('/auth/register', { full_name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('workspace', JSON.stringify(data.workspace));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    api.defaults.headers.common['x-workspace-id'] = data.workspace?.id;
    setUser(data.user);
    setWorkspace(data.workspace);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('workspace');
    delete api.defaults.headers.common['Authorization'];
    delete api.defaults.headers.common['x-workspace-id'];
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
