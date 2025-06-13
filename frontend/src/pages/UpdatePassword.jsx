import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading true
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidReset, setIsValidReset] = useState(false);
  const navigate = useNavigate();

  // Handle the password reset flow when component mounts
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Check if we have a recovery session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (mounted) {
            setError('Invalid or expired password reset link. Please request a new one.');
            setLoading(false);
          }
          return;
        }

        // Check if this is a password recovery session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          if (mounted) {
            setError('Invalid or expired password reset link. Please request a new one.');
            setLoading(false);
          }
          return;
        }

        // Check if the user has a recovery session
        if (user.app_metadata?.provider === 'email' && user.aud === 'authenticated') {
          if (mounted) {
            setIsValidReset(true);
            setMessage('Please enter your new password below.');
            setLoading(false);
          }
        } else {
          if (mounted) {
            setError('Invalid or expired password reset link. Please request a new one.');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        if (mounted) {
          setError('An error occurred while verifying your session. Please try again.');
          setLoading(false);
        }
      }
    };

    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User has clicked the password reset link
        if (mounted) {
          setIsValidReset(true);
          setMessage('Please enter your new password below.');
          setLoading(false);
        }
      }
    });

    // Check the current session
    checkSession();

    // Clean up the listener when component unmounts
    return () => {
      mounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const validatePassword = (pass) => {
    if (pass.length < 6) return 'Password must be at least 6 characters long';
    return null;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!password || !confirm) {
      setError('Please fill in both fields.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }


    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Sign out from all other sessions
      await supabase.auth.signOut({ scope: 'others' });

      setMessage('Password updated successfully! Redirecting to sign in...');
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        // Clear the session and redirect to sign in
        supabase.auth.signOut().then(() => {
          navigate('/signin');
        });
      }, 2000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again or request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifying your request...</p>
        </div>
      </div>
    );
  }

  // Show error state if not a valid reset session
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-center">
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-400 rounded-lg">
            {error}
          </div>
          <a 
            href="/forgot-password" 
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
          >
            Request New Reset Link
          </a>
          <div className="mt-4">
            <a href="/signin" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show the password reset form only if we have a valid reset session
  if (isValidReset) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Reset Your Password</h2>
            <p className="text-gray-400">Enter your new password below</p>
          </div>
          
          {message && (
            <div className="mb-6 p-3 bg-green-900/30 border border-green-800 text-green-400 rounded-lg text-center">
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                placeholder="Enter new password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-60 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Fallback in case of unexpected state
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-center">
        <div className="mb-6 p-3 bg-yellow-900/30 border border-yellow-800 text-yellow-400 rounded-lg">
          Invalid request. Please use the password reset link from your email.
        </div>
        <a 
          href="/forgot-password" 
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
        >
          Request New Reset Link
        </a>
        <div className="mt-4">
          <a href="/signin" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
