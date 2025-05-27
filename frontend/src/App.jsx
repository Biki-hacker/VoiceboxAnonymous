// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// SEO Component
import SEO from './components/SEO';

// Pages & Components
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import EmployeeVerification from './components/EmployeeVerification';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Component to handle page title and meta updates
const PageMetadata = () => {
  const location = useLocation();
  
  const getPageMetadata = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Voicebox Anonymous - Secure Anonymous Feedback Platform',
          description: 'Empower your workforce with secure, anonymous feedback, complaints, and suggestions. Total anonymity guaranteed with advanced security features.',
          keywords: 'anonymous feedback, employee feedback, secure feedback, anonymous complaints, suggestion box, workplace feedback',
        };
      case '/signin':
        return {
          title: 'Sign In - Voicebox Anonymous',
          description: 'Sign in to access your Voicebox Anonymous account and start giving or receiving anonymous feedback.',
          noindex: true,
        };
      case '/signup':
        return {
          title: 'Create Account - Voicebox Anonymous',
          description: 'Create a new Voicebox Anonymous account to enable secure, anonymous feedback in your organization.',
        };
      case '/forgotpassword':
        return {
          title: 'Reset Password - Voicebox Anonymous',
          description: 'Reset your Voicebox Anonymous account password.',
          noindex: true,
        };
      case '/posts':
        return {
          title: 'Feedback Feed - Voicebox Anonymous',
          description: 'View and interact with anonymous feedback and discussions in your organization.',
        };
      default:
        return {
          title: 'Voicebox Anonymous - Secure Anonymous Feedback Platform',
          description: 'Empower your workforce with secure, anonymous feedback, complaints, and suggestions.',
        };
    }
  };

  const { title, description, keywords, noindex } = getPageMetadata();
  
  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      noindex={noindex}
    />
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/updatepassword" element={<UpdatePassword />} />

      {/* Protected Routes with Role-Based Access */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-dashboard"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/verify"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeVerification />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

function App() {
  return (
    <Router>
      <PageMetadata />
      <AppRoutes />
    </Router>
  );
}

export default App;
