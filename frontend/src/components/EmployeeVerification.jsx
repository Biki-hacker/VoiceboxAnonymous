// src/pages/EmployeeVerification.jsx
import React, { useState } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EmployeeVerification = () => {
  const [orgSearch, setOrgSearch] = useState('');
  const [organization, setOrganization] = useState(null);
  const [params, setParams] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/organizations/search?name=${orgSearch}`);
      setOrganization(res.data);
      setParams({});
    } catch (err) {
      setOrganization(null);
      setError('Organization not found. Please check the name.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!organization) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/users/verify', {
        organizationId: organization._id,
        verificationParams: params,
      });

      if (res.data.success) {
        navigate('/employee-dashboard');
      } else {
        setError('Verification failed. Please check your details.');
      }
    } catch (err) {
      setError('Verification error. Please try again.');
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
            className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            {loading ? 'Searching...' : 'Search Organization'}
          </button>
        </div>

        {organization && (
          <>
            <h3 className="text-xl font-semibold mb-2 text-center">{organization.name}</h3>
            {organization.verificationFields.map((field) => (
              <input
                key={field}
                type="text"
                placeholder={`Enter your ${field}`}
                className="w-full p-2 mb-2 rounded text-black"
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            ))}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
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
