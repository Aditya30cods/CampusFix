import { createContext, useContext, useMemo, useState } from 'react';
import api from './api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('campusfix-user')); } catch { return null; } });
  const login = async credentials => { const { data } = await api.post('/auth/login', credentials); localStorage.setItem('campusfix-token', data.token); localStorage.setItem('campusfix-user', JSON.stringify(data.user)); setUser(data.user); };
  const register = async fields => { const { data } = await api.post('/auth/register', fields); localStorage.setItem('campusfix-token', data.token); localStorage.setItem('campusfix-user', JSON.stringify(data.user)); setUser(data.user); };
  const updateUser = nextUser => { localStorage.setItem('campusfix-user', JSON.stringify(nextUser)); setUser(nextUser); };
  const logout = () => { localStorage.removeItem('campusfix-token'); localStorage.removeItem('campusfix-user'); setUser(null); };
  const value = useMemo(() => ({ user, login, register, updateUser, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
