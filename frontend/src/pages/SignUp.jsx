// src/pages/SignUp.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee'); // default role
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Corrected: two separate args—credentials, then options including data for user_metadata
    const { data, error: signUpError } = await supabase.auth.signUp(
      { email, password },
      {
        data: { role },
        emailRedirectTo: 'http://localhost:5173/updatepassword',
      }
    );

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setMessage("Check your inbox to confirm your email.");
      // After confirmation, Supabase will fire the webhook which inserts into MongoDB
      setTimeout(() => navigate('/signin'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSignUp} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Sign Up</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded text-black"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          className="w-full p-2 rounded text-black"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          className="w-full p-2 rounded text-black"
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="flex items-center space-x-2">
          <input type="checkbox" onChange={() => setShowPassword(!showPassword)} />
          <label className="text-sm">Show Password</label>
        </div>

        <label className="block text-sm">
          I am signing up as:
          <select
            className="w-full mt-1 p-2 rounded text-black"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <button className="w-full bg-white text-black py-2 rounded hover:bg-gray-300">Register</button>

        {message && <p className="text-green-400 text-sm">{message}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <p className="text-sm text-gray-300">
          Already have an account? <Link to="/signin" className="text-blue-400">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
