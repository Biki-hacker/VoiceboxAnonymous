// src/components/EmployeeVerification.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EmployeeVerification = () => {
  const [orgSearch, setOrgSearch] = useState('');
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
    if (!orgSearch.trim()) {
      setError('Please enter an organization name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/organizations/search?name=${orgSearch}`);
      if (res.data) {
        setOrganization(res.data);
        setParams({});
      } else {
        setError('Organization not found. Please check the name.');
      }
    } catch (err) {
      console.error('Error searching organization:', err);
      setOrganization(null);
      setError('Failed to search organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!organization || !email) return;

    // Check if all required fields are filled
    const missingFields = organization.verificationFields.filter(field => !params[field]);
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
      setError('Verification failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Employee Verification</h2>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your organization name"
            className="w-full p-2 rounded text-black"
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:bg-blue-300"
          >
            {loading ? 'Searching...' : 'Search Organization'}
          </button>
        </div>

        {organization && (
          <>
            <h3 className="text-xl font-semibold mb-2 text-center">{organization.name}</h3>
            {organization.verificationFields && organization.verificationFields.length > 0 ? (
              organization.verificationFields.map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={`Enter your ${field}`}
                  className="w-full p-2 mb-2 rounded text-black"
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                />
              ))
            ) : (
              <p className="text-yellow-400 mb-2 text-center">
                This organization doesn't require verification parameters.
              </p>
            )}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded disabled:bg-green-300"
            >
              {loading ? 'Verifying...' : 'Submit Verification'}
            </button>
          </>
        )}

        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default EmployeeVerification;