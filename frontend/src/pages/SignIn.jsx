// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { api } from '../utils/axios'; // Use the consolidated axios instance
import { FaGithub } from 'react-icons/fa';

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value.trim()
    }));
  };

  const handleSocialSignIn = async (provider) => {
    try {
      setMessage('');
      setLoading(true);
      
      // Store the current path to redirect back after sign in
      localStorage.setItem('redirectAfterSignIn', window.location.pathname);
      
      // Use the main auth callback URL
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      // Set up provider options
      const providerOptions = {
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      };
      
      // Trigger OAuth sign-in
      const { error } = await supabase.auth.signInWithOAuth(providerOptions);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Social sign-in error:', err);
      setMessage(err.message || 'Social sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { email, password } = formData;
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      // 1) Sign in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setMessage(signInError.message);
        setLoading(false);
        return;
      }

      // 2) Make sure we got a session
      if (!signInData.session) {
        setMessage('Login succeeded but no session returned.');
        setLoading(false);
        return;
      }

      // 3) Get backend JWT token using the consolidated axios instance
      console.log('Attempting to authenticate with backend...');
      
      let backendResponse;
      try {
        backendResponse = await api.post(
          '/auth/login',
          {
            email,
            supabaseToken: signInData.session.access_token
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
        console.log('Backend response:', JSON.stringify(backendResponse.data, null, 2));
      } catch (err) {
        console.error('Backend authentication error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            baseURL: err.config?.baseURL,
            headers: err.config?.headers
          }
        });
        throw new Error(`Backend authentication failed: ${err.message}`);
      }

      if (!backendResponse?.data) {
        console.error('No data in backend response');
        throw new Error('No data received from authentication server');
      }

      const responseData = backendResponse.data;
      console.log('Full auth response:', responseData);
      
      const { token, role, verified, orgId, userId, user } = responseData;
      
      if (!token || role === undefined || verified === undefined) {
        console.error('Invalid response data:', responseData);
        throw new Error('Invalid authentication response received');
      }

      // Function to decode JWT token
      const decodeJWT = (token) => {
        try {
          // Get the payload part of the token
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          console.error('Error decoding JWT:', e);
          return null;
        }
      };

      // Try to get user ID from different possible locations
      let resolvedUserId = userId || 
                          user?._id || 
                          responseData.user?._id || 
                          responseData.userId;
      
      // If still no user ID, try to get it from the JWT token
      if (!resolvedUserId && token) {
        const decodedToken = decodeJWT(token);
        console.log('Decoded JWT token:', decodedToken);
        resolvedUserId = decodedToken?.userId || 
                        decodedToken?.user?._id || 
                        decodedToken?.sub; // Standard JWT subject field
      }
      
      console.log('Authentication response:', { 
        email, 
        role, 
        verified, 
        userId: resolvedUserId,
        responseData: JSON.parse(JSON.stringify(responseData)) // Create a safe copy for logging
      });
      
      if (!resolvedUserId) {
        console.error('Could not determine user ID from response:', responseData);
        // Instead of throwing an error, we'll use email as a fallback for now
        console.warn('Falling back to using email as user ID');
        // For debugging, log the JWT token parts
        if (token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            console.log('JWT Header:', JSON.parse(atob(parts[0])));
            console.log('JWT Payload:', JSON.parse(atob(parts[1])));
          }
        }
      }

      // Store user data in localStorage
      // Always store the resolved user ID, falling back to email if needed
      const storageUserId = resolvedUserId || email;
      
      localStorage.setItem('email', email);
      localStorage.setItem('role', role);
      localStorage.setItem('verified', verified || false);
      localStorage.setItem('orgId', orgId || '');
      localStorage.setItem('token', token);
      localStorage.setItem('userId', storageUserId);
      localStorage.setItem('supabaseToken', signInData.session.access_token);
      
      console.log('Stored user data in localStorage:', {
        email,
        userId: storageUserId,
        role,
        orgId,
        verified,
        source: resolvedUserId ? 'fromBackend' : 'fallbackToEmail'
      });
      
      // Route based on role and verification status
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'employee') {
        if (verified) {
          navigate('/employee-dashboard');
        } else {
          navigate('/verify');
        }
      } else {
        setMessage('Unrecognized user role.');
      }
    } catch (err) {
      console.error('Error during sign in process:', err);
      setMessage(err.response?.data?.message || 'Sign in failed. Please check your credentials or try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        
        {/* Social Sign In Buttons */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialSignIn('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 border border-gray-300"
              title="Sign in with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="md:inline hidden">Google</span>
            </button>
            <button
              onClick={() => handleSocialSignIn('github')}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              <FaGithub className="text-xl" />
              <span className="md:inline hidden">GitHub</span>
            </button>
          </div>
          
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="px-3 text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="p-2 rounded text-black"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="p-2 rounded text-black"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:bg-blue-300"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          {message && <p className="text-sm text-red-400 text-center">{message}</p>}
        </form>
        <div className="text-center mt-4">
          <p>
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </a>
          </p>
          <p className="mt-2">
            <a href="/forgotpassword" className="text-blue-400 hover:underline">
              Forgot Password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}