import axios from 'axios';
import { supabase } from '../supabaseClient';

// Create a function to get the base URL
const getBaseUrl = () => {
  // In development, use the full URL to avoid CORS issues
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000/api';
  }
  // In production, use the full backend URL
  return 'https://voiceboxanonymous.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Important for sending cookies
  timeout: 60000, // 60 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the Supabase session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) throw refreshError;

        // Get new backend token
        const response = await api.post('/auth/refresh-token', {
          supabaseToken: session.access_token
        });

        const { token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('supabaseToken', session.access_token);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear everything and redirect to signin
        localStorage.clear();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api }; 