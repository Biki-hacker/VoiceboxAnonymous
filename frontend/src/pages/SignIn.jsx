// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { api } from '../api/axios';

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const { email, password } = formData;

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setMessage(signInError.message);
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage('Failed to fetch user details.');
        return;
      }

      const role = user.user_metadata?.role;

      if (role === 'admin') {
        localStorage.setItem('role', 'admin');
        navigate('/admin-dashboard');
      } else if (role === 'employee') {
        // Check backend for employee verification status
        const verifyRes = await api.get(`/auth/verify-status?email=${email}`);
        if (verifyRes.data.verified) {
          localStorage.setItem('role', 'employee');
          localStorage.setItem('orgId', verifyRes.data.orgId); // Save orgId for posts
          navigate('/employee-dashboard');
        } else {
          localStorage.setItem('role', 'employee');
          navigate('/verify');
        }
      } else {
        setMessage('Unknown user role.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Unexpected error. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="p-2 rounded text-black"
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="p-2 rounded text-black"
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
};

export default SignIn;
