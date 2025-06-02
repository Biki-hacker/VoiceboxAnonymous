import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { api } from '../utils/axios';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      let authResponse = null;
      let role = '';
      let session = null;
      
      try {
        // Get the session from the URL
        const sessionData = await supabase.auth.getSession();
        session = sessionData?.data?.session;
        const authError = sessionData?.error;
        
        if (authError || !session) {
          throw new Error('Authentication failed. Please try again.');
        }

        // For sign-in, we'll determine the role from the user's existing account
        // For sign-up, we'll use the role from localStorage if available
        role = localStorage.getItem('oauth_role') || 'employee';
        
        // Try to log in first
        try {
          const loginResponse = await api.post('/auth/login', {
            email: session.user.email,
            supabaseToken: session.access_token,
            isOAuth: true,
            role
          });
          
          console.log('OAuth login successful:', loginResponse.data);
          authResponse = loginResponse;
          
        } catch (loginError) {
          console.log('Login failed, attempting to register...', loginError);
          
          // If login fails, try to register
          try {
            const registerResponse = await api.post('/auth/register', {
              email: session.user.email,
              role,
              isOAuth: true
            });
            
            console.log('User registration successful:', registerResponse.data);
            authResponse = registerResponse;
            
          } catch (registerError) {
            console.error('Registration failed:', registerError);
            throw new Error('Failed to authenticate or create user account. Please try again.');
          }
        }
        
        // If we get here, we have a successful authResponse
        if (!authResponse?.data) {
          throw new Error('Authentication response is invalid');
        }
        
        // Store the token and user data
        if (authResponse.data.token) {
          localStorage.setItem('token', authResponse.data.token);
        }
        
        // Update role from response if available
        if (authResponse.data.user) {
          const { email: userEmail, role: userRole } = authResponse.data.user;
          role = userRole || role;
          localStorage.setItem('email', userEmail);
          localStorage.setItem('role', role);
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
        const verified = authResponse?.data?.verified || 
                        authResponse?.data?.user?.verified || 
                        localStorage.getItem('verified') === 'true';
        
        // Store verification status in localStorage
        localStorage.setItem('verified', verified.toString());
        
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
        console.log(`[AuthCallback] Redirecting to: ${finalPath}`, { 
          role, 
          verified,
          cleanRedirectPath,
          targetPath,
          authResponse: {
            hasToken: !!authResponse?.data?.token,
            hasUser: !!authResponse?.data?.user,
            verified: authResponse?.data?.verified || authResponse?.data?.user?.verified
          }
        });
        
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