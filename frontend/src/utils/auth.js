import { api } from './axios';  // Use the consolidated axios instance
import { toast } from 'react-toastify';

// Clear all auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  localStorage.removeItem('orgId');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Handle API errors
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  const errorMessage = error.response?.data?.message || 
                     error.message || 
                     defaultMessage;
  
  // Don't show toast for 401 errors as they're handled by the interceptor
  if (error.response?.status !== 401) {
    toast.error(errorMessage);
  }
  
  return Promise.reject(error);
};

// Make authenticated API request
export const authRequest = async (method, url, data = {}, options = {}) => {
  try {
    const response = await api({
      method,
      url,
      data,
      ...options,
      retry: 3, // Retry up to 3 times
      retryDelay: 1000, // 1 second delay between retries
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
