// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../api/axios';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let controller = new AbortController();
    
    const verifyUser = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      
      try {
        // Check localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        console.log('[ProtectedRoute] localStorage token:', token);
        console.log('[ProtectedRoute] localStorage role:', role);
        
        // If we have a token and role matches, we can be optimistic
        if (token && role === requiredRole) {
          const lastVerified = localStorage.getItem('lastVerified');
          const now = new Date().getTime();
          console.log('[ProtectedRoute] lastVerified:', lastVerified, 'now:', now);
          
          if (lastVerified && (now - parseInt(lastVerified, 10)) < 5 * 60 * 1000) {
            console.log('[ProtectedRoute] Using cached auth, granting access');
            if (isMounted) setIsAuthorized(true);
            return;
          }
        }
        
        if (!token) {
          console.log('[ProtectedRoute] No token found in localStorage, redirecting');
          if (isMounted) setIsAuthorized(false);
          return;
        }

        const email = localStorage.getItem('email');
        if (!email) {
          console.log('[ProtectedRoute] No email found in localStorage, cannot verify');
          if (isMounted) setIsAuthorized(false);
          return;
        }

        console.log('[ProtectedRoute] Sending /auth/verify-status request...');
        // Verify with backend
        const response = await api.get('/auth/verify-status', {
          signal: controller.signal,
          params: { email },
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        console.log('[ProtectedRoute] /auth/verify-status response:', response);
        
        if (response.data.success) {
          // Update last verified timestamp
          localStorage.setItem('lastVerified', new Date().getTime().toString());
          
          // Make sure localStorage is in sync with backend
          const { role: userRole, orgId, token: newToken } = response.data;
          
          if (userRole) localStorage.setItem('role', userRole);
          if (orgId) localStorage.setItem('orgId', orgId);
          if (newToken) localStorage.setItem('token', newToken);
          
          if (userRole === requiredRole) {
            if (isMounted) setIsAuthorized(true);
          } else {
            console.log('Role mismatch. Required:', requiredRole, 'Got:', userRole);
            if (isMounted) setIsAuthorized(false);
          }
        } else {
          console.log('Verification failed:', response.data);
          if (isMounted) setIsAuthorized(false);
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          // Request was canceled, no need to handle
          return;
        }
        
        console.error('[ProtectedRoute] Authorization check failed:', error, error.response?.data || error.message);
        
        // Only clear auth data on explicit auth failures
        if (error.response?.status === 401) {
          console.log('[ProtectedRoute] 401 Unauthorized, clearing localStorage and redirecting');
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          localStorage.removeItem('role');
          localStorage.removeItem('orgId');
          if (isMounted) setIsAuthorized(false);
        } else if (isMounted) {
          // For other errors, we'll assume the user is still authorized
          // This prevents logging out on transient network issues
          setIsAuthorized(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifyUser();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [requiredRole, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
          <p className="text-sm text-gray-400">Verifying your access</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <Navigate 
        to="/signin" 
        state={{ 
          from: location.pathname,
          message: `You need ${requiredRole} access for this page` 
        }} 
        replace 
      />
    );
  }

  return children;
};

export default ProtectedRoute;