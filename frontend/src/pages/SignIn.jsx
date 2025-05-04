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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    try {
      // Get user role from MongoDB using email
      const res = await api.get(`/users/role?email=${email}`);
      const role = res.data.role;

      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'employee') {
        navigate('/verify');
      } else {
        setMessage('Unknown user role.');
      }
    } catch (err) {
      setMessage('Error fetching user role. Please try again.');
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
