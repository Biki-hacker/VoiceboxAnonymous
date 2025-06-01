// src/pages/UpdatePassword.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid access token in the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    // Only allow access if it's a password recovery flow
    if (type === 'recovery' && accessToken) {
      // Set the session using the access token from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(({ error }) => {
        if (error) {
          setError('Invalid or expired password reset link.');
        }
        setLoading(false);
      });
    } else {
      setError('Invalid password reset link.');
      setLoading(false);
    }
  }, [searchParams]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setMessage('Password updated successfully! Redirecting to sign in...');
      // Sign out the user after password reset
      await supabase.auth.signOut();
      setTimeout(() => navigate('/signin'), 2000);
    } catch (error) {
      setError(error.message || 'Failed to update password. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h2>
        {error ? (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
              disabled={!newPassword || !confirmPassword}
            >
              Update Password
            </button>
          </form>
        )}
        {message && (
          <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded text-green-200">
            {message}
          </div>
        )}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/signin')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
