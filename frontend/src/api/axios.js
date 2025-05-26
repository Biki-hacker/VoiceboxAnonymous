// src/api/axios.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Create a function to get the base URL
const getBaseUrl = () => {
  // In development, use the full URL to avoid CORS issues
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000/api';
  }
  // In production, use relative URL
  return '/api';
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies
  timeout: 30000, // 30 seconds timeout
});

// Track if a token refresh is in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
    
    // Handle connection errors
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || !error.response) {
      toast.error('Connection error. Please check your internet connection.');
      return Promise.reject(error);
    }
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token refresh is in progress, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Try to refresh the token using POST
        const response = await api.post('/auth/refresh-token', {}, { withCredentials: true });
        
        if (response.data.token) {
          const { token } = response.data;
          
          // Store the new token
          localStorage.setItem('token', token);
          
          // Update the Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Process any queued requests
          processQueue(null, token);
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('orgId');
        
        // Process queue with error
        processQueue(refreshError, null);
        
        // Redirect to login
        if (window.location.pathname !== '/signin') {
          window.location.href = '/signin';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 404) {
      toast.error('Requested resource not found.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }
    
    return Promise.reject(error);
  }
);

// Add retry interceptor for failed requests
api.interceptors.response.use(undefined, (error) => {
  const { config, message } = error;
  
  // If config doesn't exist or retry option is not set, reject
  if (!config || config.retry === undefined) {
    return Promise.reject(error);
  }
  
  // Retry on network errors or 5xx errors
  const shouldRetry = 
    message.includes('timeout') || 
    message.includes('Network Error') ||
    (error.response && error.response.status >= 500);
    
  if (shouldRetry && config.retry > 0) {
    // Decrease retry count
    config.retry--;
    
    // Create new promise to handle exponential backoff
    const backoff = new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, (config.retryDelay || 1000) * (3 - config.retry)); // Exponential backoff
    });
    
    // Return the promise in which we'll make the retry
    return backoff.then(() => {
      return api(config);
    });
  }
  
  // Reject if we're out of retries
  return Promise.reject(error);
});