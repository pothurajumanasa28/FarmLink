import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('srgrec_token'));
  const [loading, setLoading] = useState(true);
  const { changeLanguage } = useLanguage();

  const loadCurrentUser = async () => {
    const savedToken = localStorage.getItem('srgrec_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.languagePreference) {
          changeLanguage(data.user.languagePreference);
        }
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Failed to load current session:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (data.success && data.token) {
      localStorage.setItem('srgrec_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user?.languagePreference) {
        changeLanguage(data.user.languagePreference);
      }
    }
    return data;
  };

  const register = async (payload) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: payload
    });

    if (data.success && data.token) {
      localStorage.setItem('srgrec_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('srgrec_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await loadCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isApproved: user?.status === 'approved',
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
