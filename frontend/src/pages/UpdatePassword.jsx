// src/pages/UpdatePassword.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password updated successfully!');
      setTimeout(() => navigate('/signin'), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-3xl font-bold mb-4">Set New Password</h2>
      <form onSubmit={handleUpdate} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          className="p-2 rounded text-black"
          type="password"
          placeholder="New Password"
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button className="bg-white text-black px-4 py-2 rounded hover:bg-gray-300">Update Password</button>
        {message && <p className="text-sm mt-2 text-green-400">{message}</p>}
      </form>
    </div>
  );
}
