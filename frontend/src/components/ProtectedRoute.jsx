// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        <p>Loading...</p>
      </div>
    );
  }

  // If no session, redirect to sign in
  if (!session) {
    return <Navigate to="/signin" />;
  }

  const userRole = session.user.user_metadata?.role;

  // If a specific role is required but doesn't match user's role
  if (requiredRole && userRole !== requiredRole) {
    console.warn(`Access denied. Required role: ${requiredRole}, but user is: ${userRole}`);
    return <Navigate to="/signin" />;
  }

  // If employee is required to have orgId, check that
  if (userRole === 'employee') {
    const orgId = localStorage.getItem('orgId');
    if (!orgId) {
      console.warn('Employee user has no orgId in localStorage.');
      return <Navigate to="/signin" />;
    }
  }

  return children;
};

export default ProtectedRoute;
