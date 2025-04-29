// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const orgId = localStorage.getItem('orgId');

  if (loading) return <div className="text-white p-4">Loading...</div>;

  return session && orgId ? children : <Navigate to="/signin" />;
};

export default ProtectedRoute;
