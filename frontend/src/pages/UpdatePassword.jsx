// src/pages/UpdatePassword.jsx
import { useState, useEffect, useLayoutEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(true);
  const navigate = useNavigate();

  // Validate password match in real-time
  useEffect(() => {
    if (newPassword && confirmPassword) {
      setIsMatching(newPassword === confirmPassword);
    } else {
      setIsMatching(true);
    }
  }, [newPassword, confirmPassword]);

  useLayoutEffect(() => {
    // Function to parse parameters from URL - checks both hash and query params
    const parseParams = () => {
      // First try to get from hash (preferred for Supabase)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      // Then try to get from query parameters (fallback)
      const searchParams = new URLSearchParams(window.location.search);
      
      // Get from hash first, fall back to query params
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || null;
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || null;
      const type = hashParams.get('type') || searchParams.get('type') || null;
      
      console.log('URL parameters:', { 
        hash: window.location.hash,
        search: window.location.search,
        accessToken: !!accessToken,
         refreshToken: !!refreshToken,
        type
      });
      
      return { accessToken, refreshToken, type };
    };
    
    // Also log the full URL for debugging
    console.log('Current URL:', window.location.href);

    // Initial check for parameters
    const { accessToken, refreshToken, type } = parseParams();
    
    if (type === 'recovery' && accessToken) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Invalid or expired password reset link. Please request a new one.');
          } else {
            console.log('Session set successfully');
          }
          setLoading(false);
        })
        .catch((catchError) => {
          console.error('Error setting session:', catchError);
          setError('Failed to process the password reset link. Please try again.');
          setLoading(false);
        });
    } else if (!loading) {
      console.error('Missing required parameters in URL hash');
      setError('Invalid password reset link. Please make sure you used the link from your email.');
      setLoading(false);
    }

    // Listen for URL changes (e.g., if the user navigates back/forward)
    const handleUrlChange = () => {
      const { accessToken, refreshToken, type } = parseParams();
      if (type === 'recovery' && accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
      }
    };
    
    // Listen for both hashchange and popstate events
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [loading]);

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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage('Password updated successfully! Redirecting to sign in...');
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
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 pr-10 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 text-xs text-blue-400 hover:text-blue-300"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">At least 6 characters required</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full p-2 pr-10 rounded bg-gray-700 border ${
                    confirmPassword && !isMatching ? 'border-red-500' : 'border-gray-600'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 text-xs text-blue-400 hover:text-blue-300"
                >
                  {showConfirmPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              {confirmPassword && !isMatching && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              disabled={!newPassword || !confirmPassword || !isMatching || newPassword.length < 6}
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
