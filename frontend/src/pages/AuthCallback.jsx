import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { api } from '../utils/axios';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session) {
          throw new Error('Authentication failed. Please try again.');
        }

        // For sign-in, we'll determine the role from the user's existing account
        // For sign-up, we'll use the role from localStorage if available
        const role = localStorage.getItem('oauth_role') || 'employee';
        
        try {
          // For OAuth, we'll use the login endpoint which handles both login and registration
          const response = await api.post('/auth/login', {
            email: session.user.email,
            supabaseToken: session.access_token,
            isOAuth: true, // Indicate this is an OAuth login
            role // Pass the role from localStorage or default
          });
          
          // If we get here, the user was either logged in or created successfully
          console.log('OAuth login successful:', response.data);
          
          // Store the token from our backend
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          
          // Store user data
          if (response.data.user) {
            const { email, role } = response.data.user;
            localStorage.setItem('email', email);
            localStorage.setItem('role', role);
          }
        } catch (apiError) {
          console.error('API Error during OAuth login:', apiError);
          
          // If there's an error, try to create the user directly
          console.log('Attempting to create user directly...');
          try {
            const registerResponse = await api.post('/auth/register', {
              email: session.user.email,
              role,
              isOAuth: true // Let the backend know this is an OAuth user
            });
            
            if (registerResponse.data.token) {
              localStorage.setItem('token', registerResponse.data.token);
              
              // Store user data
              if (registerResponse.data.user) {
                const { email, role } = registerResponse.data.user;
                localStorage.setItem('email', email);
                localStorage.setItem('role', role);
              }
            }
          } catch (registerError) {
            console.error('Failed to create user:', registerError);
            throw new Error('Failed to create user account. Please try again.');
          }
        }

        // Store Supabase session data
        localStorage.setItem('supabaseToken', session.access_token);
        localStorage.setItem('email', session.user.email);
        localStorage.setItem('role', role);
        
        // Clean up stored data
        const redirectPath = localStorage.getItem('redirectAfterSignIn');
        localStorage.removeItem('oauth_role');
        localStorage.removeItem('redirectAfterSignIn');
        
        // Handle redirection based on role and verification status
        const verified = response?.data?.verified || localStorage.getItem('verified') === 'true';
        
        // Store verification status in localStorage
        if (typeof verified === 'boolean') {
          localStorage.setItem('verified', verified.toString());
        }
        
        // Clear any existing redirect path if it exists
        const cleanRedirectPath = redirectPath && redirectPath !== '/signin' ? redirectPath : null;
        
        // Determine the target path based on role and verification status
        let targetPath = '/';
        
        if (role === 'admin') {
          targetPath = '/admin-dashboard';
        } else if (role === 'employee') {
          targetPath = verified ? '/employee-dashboard' : '/employee/verify';
        }
        
        // Use the clean redirect path if available, otherwise use the role-based path
        const finalPath = cleanRedirectPath || targetPath;
        console.log(`[AuthCallback] Redirecting to: ${finalPath}`);
        navigate(finalPath, { replace: true });
        
      } catch (err) {
        console.error('Authentication callback error:', err);
        // Redirect to signup page with error
        navigate('/signup', { 
          state: { 
            error: err.message || 'Authentication failed. Please try again.' 
          } 
        });
      }
    };

    handleAuth();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-white">Completing sign in...</p>
      </div>
    </div>
  );
}