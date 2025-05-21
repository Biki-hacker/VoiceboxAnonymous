// src/api/axios.js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if it's an authentication error (invalid/expired token)
      if (error.response.data?.message === 'Invalid token' || 
          error.response.data?.message === 'Token expired' ||
          error.response.data?.message === 'Authentication required') {
        localStorage.clear();
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);