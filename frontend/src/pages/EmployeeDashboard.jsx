// src/pages/EmployeeDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome, Anonymous Employee</h2>
      <p>Select an action:</p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/employee/create-post')}>Create Post</button>
        <button onClick={() => navigate('/employee/posts')}>View Posts</button>
        <button onClick={() => navigate('/employee/verify')}>Re-Verify Org</button>
        <button onClick={() => {
          localStorage.clear();
          navigate('/signin');
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
