// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        email,
        password
      });
      const { token, user } = response.data;
      
      if (!user || !user._id) {
        throw new Error('User ID not found in response');
      }
      
      // Store all user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      localStorage.setItem('role', user.role);
      localStorage.setItem('userId', user._id); // Store MongoDB user ID
      
      if (user.organizationId) {
        // Trim any whitespace from organization ID before storing
        const trimmedOrgId = user.organizationId.toString().trim();
        localStorage.setItem('orgId', trimmedOrgId);
        console.log('Stored organization ID (trimmed):', trimmedOrgId);
      }
      
      console.log('User logged in:', { email, userId: user._id, role: user.role });
      setUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (email, password, role, organizationId) => {
    try {
      setError(null);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        email,
        password,
        role,
        organizationId
      });
      
      const { token, user } = response.data;
      
      if (!user || !user._id) {
        throw new Error('User ID not found in registration response');
      }
      
      // Store all user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', user._id); // Store MongoDB user ID
      
      if (organizationId) {
        // Trim any whitespace from organization ID before storing
        const trimmedOrgId = organizationId.toString().trim();
        localStorage.setItem('orgId', trimmedOrgId);
        console.log('Stored organization ID (trimmed):', trimmedOrgId);
      }
      
      console.log('User registered:', { email, userId: user._id, role });
      setUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth-related localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('orgId');
      localStorage.removeItem('userId');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
