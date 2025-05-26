// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';

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

      // 3) Get backend JWT token using the full API URL
      console.log('Attempting to authenticate with backend...');
      console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/auth/login`);
      
      let backendResponse;
      try {
        backendResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/login`,
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
          headers: err.response?.headers,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          }
        });
        throw new Error(`Backend authentication failed: ${err.message}`);
      }

      if (!backendResponse?.data) {
        console.error('No data in backend response');
        throw new Error('No data received from authentication server');
      }

      const { token, role, verified, orgId } = backendResponse.data;
      
      if (!token || role === undefined || verified === undefined) {
        console.error('Invalid response data:', backendResponse.data);
        throw new Error('Invalid authentication response received');
      }

      console.log('Authentication successful for user:', { email, role, verified });
      
      // Create a user object in the expected format
      const user = {
        _id: email, // Using email as ID since _id is not provided
        email,
        role,
        organizationId: orgId,
        verified
      };

      // Store user data in localStorage
      localStorage.setItem('email', email);
      localStorage.setItem('role', role);
      localStorage.setItem('verified', verified || false);
      localStorage.setItem('orgId', orgId || '');
      localStorage.setItem('token', token);
      localStorage.setItem('supabaseToken', signInData.session.access_token);
      
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