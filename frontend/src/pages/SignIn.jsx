// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate }      from 'react-router-dom';
import { supabase }         from '../supabaseClient';
import { api }              from '../api/axios';

const SignIn = () => {
  const [formData, setForm] = useState({ email:'', password:'' });
  const [message, setMsg]   = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    const { email, password } = formData;
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setMsg(signInErr.message);
      return;
    }

    // Fetch role + verification from your backend
    try {
      const res = await api.get(`/auth/verify-status?email=${encodeURIComponent(email)}`);
      if (!res.data) throw new Error('No data');
      const { role, verified, orgId } = res.data;

      localStorage.setItem('role', role);
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'employee') {
        localStorage.setItem('orgId', orgId || '');
        if (verified) {
          navigate('/employee-dashboard');
        } else {
          navigate('/verify');
        }
      } else {
        setMsg('Unknown role.');
      }
    } catch (err) {
      console.error(err);
      setMsg('Failed to fetch user info.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="email"    type="email"    placeholder="Email"    required className="p-2 rounded text-black" onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" required className="p-2 rounded text-black" onChange={handleChange} />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">Sign In</button>
          {message && <p className="text-sm text-red-400 text-center">{message}</p>}
        </form>
        <div className="text-center mt-4">
          <p>Don’t have an account? <a href="/signup" className="text-blue-400 hover:underline">Sign Up</a></p>
          <p className="mt-2"><a href="/forgotpassword" className="text-blue-400 hover:underline">Forgot Password?</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
