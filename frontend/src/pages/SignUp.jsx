// src/pages/SignUp.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { api } from '../api/axios'; // axios instance pointed at your backend
import { useNavigate, Link } from 'react-router-dom';

export default function SignUp() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPassword, setShow]       = useState(false);
  const [role, setRole]               = useState('employee');
  const [message, setMessage]         = useState('');
  const [error, setError]             = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // 1) Create in Supabase
    const { error: signUpError } = await supabase.auth.signUp(
      { email, password },
      { emailRedirectTo: 'http://localhost:5173/updatepassword' }
    );
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2) Persist in your backend (MongoDB Atlas)
    const { data, error: regErr } = await api.post('/auth/register', { email, role });
    if (regErr || !data.success) {
      setError(regErr?.message || 'Registration failed on backend.');
      return;
    }

    setMessage('Check your inbox to confirm your email.');
    setTimeout(() => navigate('/signin'), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSignUp} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Sign Up</h2>
        <input type="email"    placeholder="Email" required className="w-full p-2 rounded text-black"
               onChange={e => setEmail(e.target.value)} />
        <input type={showPassword ? 'text' : 'password'} placeholder="Password" required className="w-full p-2 rounded text-black"
               onChange={e => setPassword(e.target.value)} />
        <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" required className="w-full p-2 rounded text-black"
               onChange={e => setConfirm(e.target.value)} />
        <div className="flex items-center space-x-2">
          <input type="checkbox" onChange={() => setShow(!showPassword)} />
          <label className="text-sm">Show Password</label>
        </div>
        <label className="block text-sm">
          I am signing up as:
          <select
            className="w-full mt-1 p-2 rounded text-black"
            value={role}
            onChange={e => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="w-full bg-white text-black py-2 rounded hover:bg-gray-300">
          Register
        </button>
        {message && <p className="text-green-400 text-sm">{message}</p>}
        {error   && <p className="text-red-400   text-sm">{error}</p>}
        <p className="text-sm text-gray-300">
          Already have an account? <Link to="/signin" className="text-blue-400">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
