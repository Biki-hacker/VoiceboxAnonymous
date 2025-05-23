// src/api/axios.js
import axios from 'axios';

// Create a function to get the base URL
const getBaseUrl = () => {
  // In development, use the full URL to avoid CORS issues
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000/api';
  }
  // In production, use relative URL
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies
  timeout: 10000, // 10 seconds timeout
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

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await axios.get(`${getBaseUrl()}/auth/refresh-token`, {
          withCredentials: true
        });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Update the Authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('orgId');
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    
    // For all other errors, just reject
    return Promise.reject(error);
  }
);