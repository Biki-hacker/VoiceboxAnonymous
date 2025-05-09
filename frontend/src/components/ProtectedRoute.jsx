// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../api/axios';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyUser = async () => {
      setIsLoading(true);
      
      // Check if we have user data in localStorage
      const email = localStorage.getItem('email');
      const role = localStorage.getItem('role');
      
      if (!email || !role) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      
      try {
        // Verify with backend
        const response = await api.get('/auth/verify-status', {
          params: { email }
        });
        
        if (response.data.success && response.data.role === requiredRole) {
          // Make sure localStorage is in sync with backend
          localStorage.setItem('role', response.data.role);
          if (response.data.orgId) {
            localStorage.setItem('orgId', response.data.orgId);
          }
          
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
          <p className="text-sm text-gray-400">Verifying your access</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/signin" state={{ message: `You need ${requiredRole} access for this page` }} replace />;
  }

  return children;
};

export default ProtectedRoute;