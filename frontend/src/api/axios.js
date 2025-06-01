// src/api/axios.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Create a function to get the base URL
const getBaseUrl = () => {
  // In development, use the full URL to avoid CORS issues
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000/api';
  }
  // In production, use the full backend URL
  return 'https://voiceboxanonymous.onrender.com/api';
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies
  timeout: 60000, // 60 seconds timeout
  retry: 3, // Number of retries for failed requests
  retryDelay: 1000, // Initial delay between retries in ms
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
    const isNetworkError = error.code === 'ECONNABORTED' || 
                         error.code === 'ECONNRESET' || 
                         !error.response ||
                         error.message === 'Network Error';
    
    if (isNetworkError) {
      // If we have retries left, let the retry interceptor handle it
      if (originalRequest.retry > 0) {
        return Promise.reject(error);
      }
      
      // If no retries left, show error
      toast.error('Connection lost. Attempting to reconnect...', {
        toastId: 'connection-error',
        autoClose: 3000,
      });
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
  const { config, code, message } = error;
  
  // If config doesn't exist or retry option is not set, reject
  if (!config || config.retry === undefined) {
    return Promise.reject(error);
  }
  
  // Check if we should retry
  const isNetworkError = code === 'ECONNABORTED' || 
                       code === 'ECONNRESET' ||
                       message === 'Network Error' ||
                       !error.response;
  
  const isServerError = error.response && error.response.status >= 500;
  const isTimeout = message.includes('timeout');
  
  const shouldRetry = isNetworkError || isServerError || isTimeout;
  
  if (shouldRetry && config.retry > 0) {
    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      (config.retryDelay || 1000) * Math.pow(2, 3 - config.retry),
      30000 // Max 30 seconds
    ) + Math.random() * 1000; // Add jitter
    
    // Decrease retry count
    config.retry--;
    
    console.log(`Retrying request (${3 - config.retry}/3) in ${Math.round(delay)}ms`);
    
    // Create new promise to handle backoff
    const backoff = new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
    
    // Return the promise in which we'll make the retry
    return backoff.then(() => {
      return api({
        ...config,
        // Ensure we don't retry indefinitely
        retry: config.retry,
        // Increase timeout for retries
        timeout: Math.min(config.timeout * 1.5, 60000) // Cap at 60s
      });
    });
  }
  
  // Reject if we're out of retries
  return Promise.reject(error);
});