import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidReset, setIsValidReset] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle the password reset flow when component mounts
  useEffect(() => {
    let mounted = true;

    const verifyPasswordReset = async () => {
      try {
        // Get the access token from the URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (!accessToken || !refreshToken || type !== 'recovery') {
          throw new Error('Invalid password reset link');
        }

        // Set the session using the tokens from the URL
        const { error: authError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (authError) throw authError;

        // Verify the user has a valid recovery session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Invalid or expired password reset link');
        }

        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        if (mounted) {
          setIsValidReset(true);
          setMessage('Please enter your new password below.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error verifying password reset:', err);
        if (mounted) {
          setError('Invalid or expired password reset link. Please request a new one.');
          setLoading(false);
        }
      }
    };

    // Set up the auth state change listener for PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (mounted) {
            setIsValidReset(true);
            setMessage('Please enter your new password below.');
            setLoading(false);
          }
        }
      }
    );

    // Check if we have a valid password reset token in the URL
    verifyPasswordReset();

    // Clean up the listener when component unmounts
    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [searchParams]);

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
      // First, verify we still have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Your session has expired. Please request a new password reset link.');
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Sign out from all other sessions
      await supabase.auth.signOut({ scope: 'others' });

      setMessage('Password updated successfully! You will be redirected to sign in...');
      
      // Wait a moment to show success message, then sign out and redirect
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          navigate('/signin', { replace: true });
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
          href="/forgotpassword" 
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
