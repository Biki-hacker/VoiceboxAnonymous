// src/pages/EmployeeVerification.jsx
import React, { useState } from 'react';
import { api } from '../api/axios';

const EmployeeVerification = () => {
  const [orgSearch, setOrgSearch] = useState('');
  const [organization, setOrganization] = useState(null);
  const [params, setParams] = useState({});
  const [verified, setVerified] = useState(false);

  const handleSearch = async () => {
    try {
      const res = await api.get(`/organizations/search?name=${orgSearch}`);
      setOrganization(res.data);
      setParams({});
    } catch (err) {
      alert('Organization not found');
    }
  };

  const handleVerify = async () => {
    try {
      const res = await api.post('/users/verify', {
        organizationId: organization._id,
        verificationParams: params,
      });
      if (res.data.success) {
        setVerified(true);
      } else {
        alert('Verification failed');
      }
    } catch (err) {
      alert('Verification error');
    }
  };

  return (
    <div>
      <h2>Verify Your Organization</h2>

      <input
        type="text"
        placeholder="Search your organization..."
        value={orgSearch}
        onChange={(e) => setOrgSearch(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {organization && (
        <>
          <h3>{organization.name}</h3>
          {organization.verificationFields.map((field) => (
            <div key={field}>
              <input
                type="text"
                placeholder={`Enter your ${field}`}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            </div>
          ))}
          <button onClick={handleVerify}>Submit Verification</button>
        </>
      )}

      {verified && (
        <p style={{ color: 'green' }}>
          ✅ You are verified. Now you can post anonymously!
        </p>
      )}
    </div>
  );
};

export default EmployeeVerification;
