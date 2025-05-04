// src/pages/EmployeeDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 0 15px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Welcome, Anonymous Employee 👤</h2>
        <p style={{ marginBottom: '2rem', color: '#555' }}>What would you like to do?</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={() => navigate('/employee/create-post')}
            style={buttonStyle}
          >
            📝 Create Post (Tag optional Region & Department)
          </button>
          <button
            onClick={() => navigate('/employee/posts')}
            style={buttonStyle}
          >
            📄 View My Posts
          </button>
          <button
            onClick={() => navigate('/employee/verify')}
            style={buttonStyle}
          >
            🔁 Re-Verify Organization
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/signin');
            }}
            style={{ ...buttonStyle, backgroundColor: '#e53935' }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  backgroundColor: '#4caf50',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

export default EmployeeDashboard;
