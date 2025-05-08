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

  // No session = Not signed in
  if (!session) {
    return <Navigate to="/signin" />;
  }

  // Get role and orgId from localStorage (Mongo-based auth system)
  const userRole = localStorage.getItem('role');
  const orgId = localStorage.getItem('orgId');

  // Role mismatch
  if (requiredRole && userRole !== requiredRole) {
    console.warn(`Access denied. Required: ${requiredRole}, Found: ${userRole}`);
    return <Navigate to="/signin" />;
  }

  // For employee, make sure orgId exists
  if (userRole === 'employee' && !orgId) {
    console.warn('Employee user has no organization ID.');
    return <Navigate to="/verify" />;
  }

  return children;
};

export default ProtectedRoute;
