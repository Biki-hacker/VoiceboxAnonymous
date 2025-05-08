// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { api } from '../api/axios';

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
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

    const { email, password } = formData;
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }

    // 1) Sign in with Supabase
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setMessage(signInError.message);
      return;
    }

    // 2) Make sure we got a session
    if (!signInData.session) {
      setMessage('Login succeeded but no session returned.');
      return;
    }

    // 3) Fetch role & verification from our backend
    try {
      const res = await api.get(`/auth/verify-status`, {
        params: { email }
      });
      const { role, verified, orgId } = res.data;

      // Persist for later
      localStorage.setItem('role', role);
      if (role === 'admin') {
        return navigate('/admin-dashboard');
      }

      if (role === 'employee') {
        if (verified) {
          localStorage.setItem('orgId', orgId || '');
          return navigate('/employee-dashboard');
        } else {
          return navigate('/verify');
        }
      }

      setMessage('Unrecognized user role.');
    } catch (err) {
      console.error('Error fetching user status:', err);
      setMessage('Failed to retrieve user info from server.');
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
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            Sign In
          </button>
          {message && <p className="text-sm text-red-400 text-center">{message}</p>}
        </form>
        <div className="text-center mt-4">
          <p>
            Don’t have an account?{' '}
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
