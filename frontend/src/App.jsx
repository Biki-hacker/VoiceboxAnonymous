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
import PricingPage from './components/PricingPage';
import Subscriptions from './components/Subscriptions';
import ProtectedRoute from './components/ProtectedRoute';
import TermsPolicy from './components/TermsPolicy';
import AuthCallback from './pages/AuthCallback';

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
      case '/pricing':
        return {
          title: 'Pricing - Voicebox Anonymous',
          description: 'Flexible pricing plans for organizations of all sizes. Choose the perfect plan that fits your needs.',
          keywords: 'pricing, plans, subscription, enterprise, pro, free plan',
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
      case '/terms-and-policy':
        return {
          title: 'Terms of Service & Privacy Policy - Voicebox Anonymous',
          description: 'Read our Terms of Service and Privacy Policy to understand how we handle your data and the terms of using our service.',
          keywords: 'terms of service, privacy policy, legal, data protection, terms and conditions',
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
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/updatepassword" element={<UpdatePassword />} />
      
      {/* OAuth Callback Routes */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/callback/admin" element={<AuthCallback />} />
      <Route path="/auth/callback/employee" element={<AuthCallback />} />

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
        path="/subscriptions"
        element={
          <ProtectedRoute requiredRole="admin">
            <Subscriptions />
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
      
      {/* Public Routes */}
      <Route path="/terms-and-policy" element={<TermsPolicy />} />
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
