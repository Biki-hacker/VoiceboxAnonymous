// src/components/EmployeeVerification.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EmployeeVerification = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [organization, setOrganization] = useState(null);
  const [params, setParams] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter the organization name or ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Use the new endpoint to search for organization by name or ID
      const res = await api.get(`/organizations/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (res.data) {
        setOrganization(res.data);
        setParams({});
      } else {
        setOrganization(null);
        setError('No organization found with this name or ID.');
      }
    } catch (err) {
      console.error('Error searching organization:', err);
      setOrganization(null);
      setError(err.response?.data?.message || 'Organization not found. Please verify the name or ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!organization || !email) return;

    // Determine which verification fields to use (supporting both field names)
    const verificationFieldsToUse = 
      organization.verificationFields?.length > 0 
        ? organization.verificationFields 
        : organization.verificationSchema || [];
    
    // Check if all required fields are filled
    const missingFields = verificationFieldsToUse.filter(field => !params[field]);
    if (missingFields.length > 0) {
      setError(`Please fill in all verification fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Send verification request to the auth controller
      const res = await api.post('/auth/verify', {
        email,
        organizationId: organization._id,
        verificationParams: params
      });

      if (res.data.success) {
        // Update localStorage with orgId
        localStorage.setItem('orgId', organization._id);
        
        // Navigate to dashboard
        navigate('/employee-dashboard', { 
          state: { message: 'Verification successful! Welcome aboard.' } 
        });
      } else {
        setError('Verification failed. Please check your details.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Employee Verification</h2>
        
        {!organization && (
          <div className="mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1 text-gray-300">Organization Name or ID</label>
              <input
                type="text"
                placeholder="Enter organization name or ID"
                className="w-full p-2 rounded text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:bg-blue-300"
            >
              {loading ? 'Searching...' : 'Find Organization'}
            </button>
            
            <div className="mt-4 text-sm text-gray-400">
              <p>Contact your organization administrator to get the correct organization name or ID.</p>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

        {organization && (
          <>
            <h3 className="text-xl font-semibold mb-2 text-center">{organization.name}</h3>
            <p className="text-center text-gray-400 mb-4">ID: {organization._id}</p>
            
            {/* Support both verificationFields and verificationSchema */}
            {(organization.verificationFields?.length > 0 || organization.verificationSchema?.length > 0) ? (
              (organization.verificationFields || organization.verificationSchema).map((field) => (
                <div key={field} className="mb-2">
                  <label className="block text-sm font-medium mb-1 text-gray-300">{field}</label>
                  <input
                    type="text"
                    placeholder={`Enter your ${field}`}
                    className="w-full p-2 rounded text-black"
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    value={params[field] || ''}
                  />
                </div>
              ))
            ) : (
              <p className="text-yellow-400 mb-2 text-center">
                This organization doesn't require verification parameters.
              </p>
            )}
            
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => {
                  setOrganization(null);
                  setSearchQuery('');
                  setError('');
                }}
                className="w-1/3 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-2/3 bg-green-500 hover:bg-green-600 text-white py-2 rounded disabled:bg-green-300"
              >
                {loading ? 'Verifying...' : 'Submit Verification'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeVerification;