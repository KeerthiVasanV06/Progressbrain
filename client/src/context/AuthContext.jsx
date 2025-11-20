// AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/api/users/profile');
        setUser(response.data.user);
        setError(null);
      } catch (err) {
        console.error('Load user error:', err);
        setToken(null);
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (data) => {
    try {
      setLoading(true);
      const response = await API.post('/api/users/login', data);
      const { token: newToken, user: newUser } = response.data;

      if (!newToken) {
        throw new Error('No token received from server');
      }

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('authToken', newToken);
      setError(null);

      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setLoading(true);
      const response = await API.post('/api/users/register', data);
      const { token: newToken, user: newUser } = response.data;

      if (!newToken) {
        throw new Error('No token received from server');
      }

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('authToken', newToken);
      setError(null);

      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
      console.error('Register error:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
