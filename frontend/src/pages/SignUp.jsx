// src/pages/SignUp.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { api } from '../utils/axios'; // Consolidated axios instance
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function SignUp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in and redirect based on role
  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      const role = localStorage.getItem('role');

      if (token && email && role) {
        // Redirect based on role
        switch (role.toLowerCase()) {
          case 'admin':
            navigate('/admin');
            break;
          case 'employee':
            navigate('/employee');
            break;
          default:
            // Clear localStorage if role is invalid
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('role');
            localStorage.removeItem('supabaseToken');
        }
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPassword, setShow]       = useState(false);
  const [role, setRole]               = useState(() => {
    // Initialize role based on navigation state
    return location.state?.fromPricing ? 'admin' : 'employee';
  });
  const [message, setMessage]         = useState('');
  const [error, setError]             = useState('');
  const [fromPricing, setFromPricing] = useState(() => {
    // Initialize fromPricing based on navigation state
    return location.state?.fromPricing || false;
  });

  useEffect(() => {
    // Update state if location state changes
    if (location.state?.fromPricing) {
      setFromPricing(true);
      setRole('admin');
    } else {
      setFromPricing(false);
    }
  }, [location.state]);

  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (pass.length < minLength) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(''); 
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      // 1) Create in Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
        { email, password },
        { emailRedirectTo: `${window.location.origin}/updatepassword` }
      );

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!signUpData.session) {
        setMessage('Please check your email to confirm your account.');
        setTimeout(() => navigate('/signin'), 3000);
        return;
      }

      // 2) Register in backend
      const { data: backendData, error: backendError } = await api.post('/auth/register', {
        email,
        role,
        supabaseToken: signUpData.session.access_token
      });

      if (backendError) {
        setError(backendError.message);
        return;
      }

      // Store tokens
      localStorage.setItem('token', backendData.token);
      localStorage.setItem('supabaseToken', signUpData.session.access_token);
      localStorage.setItem('email', email);
      localStorage.setItem('role', role);

      setMessage('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/verify');
        }
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again later.');
    }
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
        {fromPricing ? (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-4">
            <p className="text-blue-300 text-sm mb-2">Please sign up as admin and choose your plan in the admin dashboard.</p>
            <div className="text-sm">
              <label className="block text-gray-300 mb-1">You're signing up as:</label>
              <div className="w-full p-2 rounded bg-gray-700 text-white">Admin</div>
              <input type="hidden" value="admin" />
            </div>
          </div>
        ) : (
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
        )}
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
