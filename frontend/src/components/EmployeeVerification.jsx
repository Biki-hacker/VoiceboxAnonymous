// src/components/EmployeeVerification.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const EmployeeVerification = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({ search: false, verify: false });
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const navigate = useNavigate();

  // Get email from localStorage when component mounts
  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (!storedEmail) {
      navigate('/signin', { state: { message: 'Please sign in to continue' } });
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  const isValidObjectId = (id) => {
    // MongoDB ObjectId is a 24-character hex string
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter the organization ID');
      return;
    }
    
    // Validate if the input is a valid MongoDB ObjectId
    if (!isValidObjectId(searchQuery.trim())) {
      setError('Please enter a valid organization ID (24-character hex string)');
      return;
    }

    setLoading(prev => ({ ...prev, search: true }));
    setError('');
    setOrganization(null);
    setIsVerified(false);
    
    try {
      // Search for organization by ID only
      const res = await api.get(`/organizations/${searchQuery}`);
      
      if (res.data) {
        setOrganization(res.data);
        // Check if email is verified for this organization
        await checkEmailVerification(res.data._id);
      } else {
        setError('No organization found with this name or ID.');
      }
    } catch (err) {
      console.error('Error searching organization:', err);
      setError('Organization not found. Please verify the ID and try again.');
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const checkEmailVerification = async (orgId) => {
    try {
      console.log('Checking email verification for:', { orgId, email });
      
      // Send email as a query parameter instead of part of the URL path
      const res = await api.get(`/organizations/${orgId}/verify-email`, {
        params: { email },
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('Email verification response:', res.data);
      
      if (res.data.success) {
        setIsVerified(res.data.data?.isVerified || false);
        
        if (!res.data.data?.isVerified) {
          setError('Your email is not authorized for this organization. Please contact your organization admin.');
        }
      } else {
        // Handle API-level errors
        console.error('Email verification failed:', res.data);
        setError(res.data.message || 'Failed to verify email. Please try again.');
      }
    } catch (err) {
      console.error('Error checking email verification:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      let errorMessage = 'Error verifying your email. Please try again.';
      
      if (err.response) {
        // Server responded with an error status code
        if (err.response.status === 404) {
          errorMessage = 'Organization not found. Please check the organization ID and try again.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (err.message) {
        // Other errors (e.g., from throw new Error)
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleVerify = async () => {
    if (!organization || !email) return;

    setLoading(prev => ({ ...prev, verify: true }));
    setError('');
    
    try {
      // Verify the user with the organization
      const res = await api.post('/auth/verify-email', {
        email,
        organizationId: organization._id
      });

      if (res.data.success) {
        // Update localStorage with orgId
        localStorage.setItem('orgId', organization._id);
        
        // Navigate to dashboard
        navigate('/employee-dashboard', { 
          state: { 
            message: 'Verification successful! Welcome aboard.',
            organization: {
              id: organization._id,
              name: organization.name
            }
          } 
        });
      } else {
        setError(res.data.message || 'Verification failed. Please try again or contact support.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please check your connection and try again.');
    } finally {
      setLoading(prev => ({ ...prev, verify: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Employee Verification</h2>
        
        {!organization ? (
          <div className="mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Organization ID
              </label>
              <input
                type="text"
                placeholder="Enter organization ID"
                className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {error && (
                <p className="mt-2 text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading.search}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.search ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Find Organization'
              )}
            </button>
            
            <div className="mt-4 p-3 bg-gray-700 rounded-md text-sm text-gray-300">
              <p className="font-medium">Need help?</p>
              <p className="mt-1">Contact your organization administrator to get your organization ID.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Organization Info */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-center">{organization.name}</h3>
              <p className="text-center text-gray-400 text-sm mt-1">ID: {organization._id}</p>
              
              <div className="mt-4 p-3 bg-gray-800 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Email Verification</span>
                  {isVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-200">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Not Verified
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {email}
                </p>
              </div>
            </div>

            {/* Status Message */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  setOrganization(null);
                  setSearchQuery('');
                  setError('');
                }}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white py-2.5 px-4 rounded-md font-medium transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back</span>
              </button>
              
              <button
                onClick={handleVerify}
                disabled={!isVerified || loading.verify}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md font-medium transition-colors ${
                  isVerified 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading.verify ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeVerification;