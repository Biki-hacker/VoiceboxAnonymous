// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/updatepassword',
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-3xl font-bold mb-4">Forgot Password?</h2>
      <form onSubmit={handleResetPassword} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          className="p-2 rounded text-black"
          type="email"
          placeholder="Your email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="bg-white text-black px-4 py-2 rounded hover:bg-gray-300">Send Reset Link</button>
        {message && <p className="text-sm mt-2 text-green-400">{message}</p>}
      </form>
    </div>
  );
}
