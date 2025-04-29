// src/pages/SignIn.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/admin-dashboard'); // Update this based on your app routing
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSignIn} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Sign In</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded text-black"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded text-black"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-white text-black py-2 rounded hover:bg-gray-300">Sign In</button>
        <p className="text-sm">
          Forgot password? <a href="/forgot-password" className="text-blue-400">Reset</a>
        </p>
        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
      </form>
    </div>
  );
}
