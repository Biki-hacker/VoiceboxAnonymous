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
            'Pragma': 'no-cache',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('[ProtectedRoute] /auth/verify-status response:', response);
        
        const responseData = response?.data;
        
        // Extract user data from the response
        // The new format has user data in response.data.data
        let userData = responseData?.data || responseData;
        
        // If we still don't have user data, check for common response formats
        if (!userData) {
          if (responseData?.user) {
            userData = responseData.user;
          } else if (responseData) {
            // If response is not in expected format but has data, use it
            userData = responseData;
          }
        }
        
        if (!userData) {
          console.error('Invalid response format:', response);
          throw new Error('Invalid server response format');
        }
        
        console.log('[ProtectedRoute] Extracted user data:', userData);
        
        // Update last verified timestamp
        localStorage.setItem('lastVerified', new Date().getTime().toString());
        
        // Extract user data from response
        const { role: userRole, organizationId, email: userEmail, verified } = userData;
        
        // For admin role, we don't need email verification
        // Just ensure the role is set correctly
        if (userRole === 'admin') {
          console.log('[ProtectedRoute] Admin user detected, skipping email verification');
          // Set verified to true for admin to bypass verification
          userData.verified = true;
        }
        
        console.log('[ProtectedRoute] Backend verification successful. User role:', userRole, 'Required role:', requiredRole);
        
        // Update local storage with fresh data
        if (userRole) {
          localStorage.setItem('role', userRole);
        } else {
          console.warn('[ProtectedRoute] No role received from backend');
        }
        
        if (organizationId) localStorage.setItem('orgId', organizationId);
        if (userEmail) localStorage.setItem('email', userEmail);
        
        if (userRole === requiredRole) {
          console.log('[ProtectedRoute] Role matches, granting access');
          if (isMounted) setIsAuthorized(true);
        } else {
          console.warn(`[ProtectedRoute] Role mismatch. Required: ${requiredRole}, Got: ${userRole || 'undefined'}`);
          // Clear potentially stale auth data
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('email');
          localStorage.removeItem('orgId');
          localStorage.removeItem('lastVerified');
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