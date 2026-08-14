import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('greenzet_token') || null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Show simulated SMS / WhatsApp / App notification toast
  const triggerNotification = (title, message, type = 'info') => {
    setNotification({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.title === title ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authApi.getProfile();
          if (res.success) {
            setUser(res.user);
          }
        } catch (err) {
          console.warn('Session expired, logging out:', err.message);
          logout();
        }
      } else {
        // Auto-login as default demo customer for smooth initial UX
        try {
          const res = await authApi.demoSwitch('customer');
          if (res.success) {
            localStorage.setItem('greenzet_token', res.token);
            setToken(res.token);
            setUser(res.user);
          }
        } catch (e) {
          console.error('Demo auto-login failed:', e);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = (authToken, userData) => {
    localStorage.setItem('greenzet_token', authToken);
    setToken(authToken);
    setUser(userData);
    triggerNotification('Welcome Back!', `Logged in as ${userData.name} (${userData.role.toUpperCase()})`, 'success');
  };

  const logout = () => {
    localStorage.removeItem('greenzet_token');
    setToken(null);
    setUser(null);
  };

  // 1-Click Role Switcher for instant testing
  const switchRole = async (targetRole) => {
    try {
      setLoading(true);
      const res = await authApi.demoSwitch(targetRole);
      if (res.success) {
        localStorage.setItem('greenzet_token', res.token);
        setToken(res.token);
        setUser(res.user);
        triggerNotification('Switched Persona', `Active Role: ${targetRole.toUpperCase()}`, 'success');
      }
    } catch (err) {
      triggerNotification('Role Switch Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateWallet = (newBalance) => {
    if (user) {
      setUser(prev => ({ ...prev, wallet_balance: newBalance }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        notification,
        login,
        logout,
        switchRole,
        updateWallet,
        triggerNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
