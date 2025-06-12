// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      // Ensure we have the correct protocol (http/https) and host
      const protocol = window.location.protocol;
      const host = window.location.host;
      
      // Important: The URL must exactly match your site URL in Supabase settings
      // and must include the full path to your update password page
      const siteUrl = `${protocol}//${host}`;
      const redirectUrl = `${siteUrl}/updatepassword`;
      
      console.log('[Password Reset] Sending password reset email to:', email);
      console.log('[Password Reset] Site URL:', siteUrl);
      console.log('[Password Reset] Using redirect URL:', redirectUrl);
      
      // First, sign out any existing session
      await supabase.auth.signOut();
      
      // Then send the reset email
      const { error } = await supabase.auth.api.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      // Debug: Log the API response
      console.log('[Password Reset] Reset email response:', { error });

      if (error) {
        console.error('[Password Reset] Error sending reset email:', error);
        throw error;
      }
      
      console.log('[Password Reset] Password reset email sent successfully');
      setMessage('Check your email for a password reset link. If you don\'t see it, please check your spam folder.');
    } catch (error) {
      console.error('[Password Reset] Failed to send reset email:', error);
      const errorMessage = error.message || 'An error occurred while sending the reset link. Please try again.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
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
        <button 
          type="submit"
          className={`w-full flex justify-center items-center px-4 py-2 rounded-md font-medium transition-colors ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed text-white' 
              : 'bg-white text-black hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : 'Send Reset Link'}
        </button>
        {message && (
          <p className={`text-sm mt-2 ${message.includes('Check your email') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
