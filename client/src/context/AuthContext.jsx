import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService.js';
import { getStoredAccessToken, setStoredAccessToken } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (err) {
      setStoredAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setStoredAccessToken(null);
      setUser(null);
    };

    window.addEventListener('saathcare:auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('saathcare:auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setStoredAccessToken(null);
      sessionStorage.removeItem('saathcare_tour_shown');
      setUser(null);
    }
  };

  const markOnboardingComplete = () => {
    setUser(prev => prev ? { ...prev, hasSeenOnboarding: true } : prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        markOnboardingComplete,
        refreshUser: initAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
