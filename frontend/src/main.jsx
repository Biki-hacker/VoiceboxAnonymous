// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';

if (
  /Chrome/.test(navigator.userAgent) &&
  /Google Inc/.test(navigator.vendor) &&
  !/Edg|OPR|Brave\//.test(navigator.userAgent)
) {
  document.body.classList.add('chrome-only');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
