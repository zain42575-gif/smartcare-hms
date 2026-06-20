import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('auth-expired', handleExpired);
    
    api.get('/auth/me')
      .then(res => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    if (res.data.data.requires2fa) {
      return { requires2fa: true, userId: res.data.data.userId };
    }
    setUser(res.data.data.user);
    return res.data;
  };

  const verify2fa = async (userId, token) => {
    const res = await api.post('/auth/2fa/verify', { userId, token });
    setUser(res.data.data.user);
    return res.data;
  };

  const registerPatient = async (payload) => {
    const res = await api.post('/auth/register-patient', payload);
    setUser(res.data.data.user);
    return res;
  };

  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    setUser(res.data.data.user);
    return res;
  };

  const registerDoctor = async (payload) => api.post('/auth/register-doctor', payload);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch(e) {}
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, verify2fa, logout, registerPatient, registerDoctor, googleLogin }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
