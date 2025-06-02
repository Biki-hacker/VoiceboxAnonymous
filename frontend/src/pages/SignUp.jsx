// src/pages/SignUp.jsx
import { useState, useEffect, Fragment, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { api } from '../utils/axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Listbox, Transition } from '@headlessui/react';
import { FaGoogle, FaGithub, FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiCheck, HiSelector } from 'react-icons/hi';
import { motion } from 'framer-motion';

export default function SignUp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole]               = useState('');
  const [showRoleError, setShowRoleError] = useState(false);
  const [message, setMessage]         = useState('');
  const [error, setError]             = useState('');
  const [fromPricing, setFromPricing] = useState(() => {
    // Initialize fromPricing based on navigation state
    return location.state?.fromPricing || false;
  });
  
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    // Trigger animation after component mounts
    setIsMounted(true);
  }, []);

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
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);

    if (pass.length < minLength) return 'Password must be at least 6 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    return null;
  };

  const validateForm = () => {
    if (!role) {
      setShowRoleError(true);
      setFormError('Please select a role');
      return false;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setFormError(passwordError);
      return false;
    }
    
    setFormError('');
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(''); 
    setMessage('');
    setShowRoleError(false);
    setFormError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // 1) First check if email exists by attempting to sign in
      console.log('Checking if email exists:', email);
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false // This will fail if user doesn't exist
        }
      });

      // If no error, email exists
      if (!signInError) {
        setFormError('Email already in use. Please use a different email or sign in.');
        return;
      }

      // If error is about OTP not being allowed for signups, that means email doesn't exist
      const isEmailAvailable = signInError.message.includes('Signups not allowed for otp') || 
                             signInError.message.includes('Email not found');

      if (!isEmailAvailable) {
        // Some other error occurred
        console.error('Error checking email:', signInError);
        setFormError('Error checking email. Please try again.');
        return;
      }

      // 2) If we get here, email doesn't exist - proceed with signup
      const dashboardPath = role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
      
      // First create user in Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${dashboardPath}`,
          data: {
            role: role
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        setFormError(signUpError.message || 'Failed to create account. Please try again.');
        return;
      }

      // 3) Now create user in our MongoDB
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password, // This will be hashed on the server side
            role,
            // Add organizationId here if needed, e.g., from location.state or other source
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create user in our system');
        }

        // Show success message
        setMessage('Registration successful! Please check your email to confirm your account and complete setup.');
        
        // Reset form
        setEmail('');
        setPassword('');
        setConfirm('');
        setRole('');

      } catch (apiError) {
        console.error('Error creating user in our system:', apiError);
        // We might want to delete the Supabase user here if MongoDB creation fails
        // But for now, just show an error
        setFormError('Account created in authentication service but failed to complete setup. Please contact support.');
      }
      
      // If there's no session, stop here (email confirmation needed)
      if (!signUpData.session) {
        return;
      }

      // 2) Register in backend (this will only run if there's a session)
      const { data: backendData, error: backendError } = await api.post('/auth/register', {
        email,
        role,
        supabaseToken: signUpData.session?.access_token || ''
      });

      if (backendError) {
        setError(backendError.message);
        return;
      }

      // Store tokens if session exists (direct login without email confirmation)
      if (signUpData.session) {
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
      } else {
        // Show success message for email confirmation
        setMessage('Registration successful! Please check your email to confirm your account.');
        // Reset form
        setEmail('');
        setPassword('');
        setConfirm('');
        setRole('');
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    if (!role) {
      setShowRoleError(true);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setFormError('');
    
    try {
      // Define the callback URL based on role
      const callbackPath = role === 'admin' 
        ? '/auth/callback/admin' 
        : '/auth/callback/employee';
      
      const redirectUrl = `${window.location.origin}${callbackPath}`;
      
      // Set up provider options
      const providerOptions = {
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Additional parameters for specific providers
          ...(provider === 'google' && {
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
              // Add Google-specific params if needed
            }
          })
        }
      };
      
      // Store the role in localStorage before OAuth redirect
      // It will be used in the AuthCallback component
      localStorage.setItem('oauth_role', role);
      
      // Initiate OAuth flow
      const { error: oauthError } = await supabase.auth.signInWithOAuth(providerOptions);
      
      if (oauthError) {
        throw new Error(oauthError.message);
      }
      
      // The actual redirection will be handled by Supabase's OAuth flow
      
    } catch (err) {
      console.error(`${provider} sign in error:`, err);
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  const roles = [
    { id: 1, name: 'Admin', value: 'admin' },
    { id: 2, name: 'Employee', value: 'employee' },
  ];

  const RoleInstructions = () => {
    if (!role) return <p className="text-gray-400 text-sm mt-2">Choose your role first</p>;
    
    return (
      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="font-medium text-lg mb-2">
          {role === 'admin' ? 'Admin Instructions' : 'Employee Instructions'}
        </h3>
        <p className="text-sm text-gray-300">
          {role === 'admin' 
            ? 'As an admin, you will have full control over your organization\'s VoiceBox account. You can manage users, view analytics, and configure settings.'
            : 'As an employee, you can participate in anonymous discussions, post feedback, and engage with your team while maintaining your privacy.'}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left side - Form */}
        <motion.div 
          className="w-full md:w-1/2 p-6 flex items-center justify-center -mt-4 bg-gray-900 relative z-10"
          initial={{ x: '100%' }}
          animate={{ 
            x: 0,
          }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100,
            mass: 0.5,
            delay: 0.1
          }}
          style={{
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'subpixel-antialiased',
            transform: 'translateZ(0)'
          }}
        >
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mt-4 mb-6 text-center">Create an Account</h2>
          
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email"
                placeholder="Enter your email" 
                required 
                onChange={e => {
                  setEmail(e.target.value);
                  // Clear form error when user starts typing
                  if (formError) setFormError('');
                }}
                className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a password" 
                  required 
                  className="w-full p-2.5 pr-10 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                placeholder="Confirm password" 
                required 
                className="w-full p-2.5 pr-10 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onChange={e => setConfirm(e.target.value)}
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            <div className="pt-2">
              <Listbox 
                value={role} 
                onChange={(value) => {
                  setRole(value);
                  setShowRoleError(false);
                }}
              >
                <div 
                  className="relative" 
                  onClick={() => setShowRoleError(false)}
                >
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-800 py-2.5 pl-3 pr-10 text-left border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 text-sm">
                    <span className={`block truncate ${!role ? 'text-gray-400' : ''}`}>
                      {role ? roles.find(r => r.value === role)?.name : 'Choose your role'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <HiSelector className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      {roles.map((roleItem) => (
                        <Listbox.Option
                          key={roleItem.id}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-300'
                            }`
                          }
                          value={roleItem.value}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium' : 'font-normal'
                                }`}
                              >
                                {roleItem.name}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                                  <HiCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
              {showRoleError && <p className="mt-1 text-sm text-red-500">Please select a role</p>}
            </div>

            <div className="space-y-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full text-white font-medium py-3 px-4 rounded-lg transition duration-200 ${
                  isSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Register
              </button>
              {(message || formError) && (
                <div className={`p-3 rounded-lg text-sm text-center ${
                  message 
                    ? 'bg-green-900/30 border border-green-800 text-green-300'
                    : 'bg-red-900/30 border border-red-800 text-red-300'
                }`}>
                  {message || formError}
                </div>
              )}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSocialSignIn('google')}
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 border border-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="hidden md:inline">Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialSignIn('github')}
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 border border-gray-700"
              >
                <FaGithub />
                <span className="hidden md:inline">GitHub</span>
              </button>
            </div>
            
            <div className="mt-2">
              <Listbox 
                value={role} 
                onChange={(value) => {
                  setRole(value);
                  setShowRoleError(false);
                }}
              >
                <div 
                  className="relative"
                  onClick={() => setShowRoleError(false)}
                >
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 text-sm">
                    <span className={`block truncate ${!role ? 'text-gray-400' : ''}`}>
                      {role ? roles.find(r => r.value === role)?.name : 'Select role for social sign-in'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <HiSelector className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      {roles.map((roleItem) => (
                        <Listbox.Option
                          key={roleItem.id}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-600 text-white' : 'text-gray-300'
                            }`
                          }
                          value={roleItem.value}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium' : 'font-normal'
                                }`}
                              >
                                {roleItem.name}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                                  <HiCheck className="h-4 w-4" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
              {showRoleError && <p className="mt-1 text-sm text-red-500">Please select a role</p>}
            </div>

            <p className="text-sm text-center text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign In
              </Link>
            </p>
          </form>
          
          {message && (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-300 text-sm">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
        </motion.div>

        {/* Right side - Instructions */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex-col items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">VoiceBox Anonymous</h1>
          <RoleInstructions />
        </div>
      </div>
      
      {/* Mobile instructions */}
      <div className="md:hidden p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-center">VoiceBox Anonymous</h1>
          <RoleInstructions />
        </div>
        </div>
      </div>
    </div>
  );
}
