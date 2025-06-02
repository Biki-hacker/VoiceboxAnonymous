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

        // Get role from localStorage (set during OAuth initiation) or default to 'employee'
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
          // Always use the role from the backend response if available
          if (userRole) {
            role = userRole;
            console.log('[AuthCallback] Updated role from backend:', role);
          }
          localStorage.setItem('email', userEmail);
          localStorage.setItem('role', role);
        } else if (authResponse.data.role) {
          // Handle case where role is in the root of the response
          role = authResponse.data.role;
          console.log('[AuthCallback] Updated role from root response:', role);
          localStorage.setItem('role', role);
        }

        // Store Supabase session data
        localStorage.setItem('supabaseToken', session.access_token);
        localStorage.setItem('email', session.user.email);
        // Don't override role here, we already set it from the response
        
        // Clean up stored data
        const redirectPath = localStorage.getItem('redirectAfterSignIn');
        localStorage.removeItem('oauth_role');
        localStorage.removeItem('redirectAfterSignIn');
        
        // Check for admin role after updating from response
        const isAdmin = role === 'admin';
        
        // For admins, always go to admin dashboard
        if (isAdmin) {
          console.log('[AuthCallback] Admin login detected, redirecting to admin dashboard', { 
            roleFromResponse: authResponse.data.user?.role,
            roleInLocalStorage: role,
            isAdmin: true
          });
          navigate('/admin-dashboard', { replace: true });
          return; // Exit early to skip the rest of the function
        }
        
        // For non-admin users, handle verification status
        const verified = authResponse?.data?.verified || 
                        authResponse?.data?.user?.verified || 
                        localStorage.getItem('verified') === 'true';
        
        // Store verification status in localStorage
        localStorage.setItem('verified', verified.toString());
        
        // Clear any existing redirect path if it exists
        const cleanRedirectPath = redirectPath && redirectPath !== '/signin' ? redirectPath : null;
        
        // For employees, check verification status
        let targetPath = verified ? '/employee-dashboard' : '/employee/verify';
        console.log('[AuthCallback] Employee login - verification status:', { verified });
        
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
        
        // Prepare error message
        let errorMessage = err.message || 'Authentication failed. Please try again.';
        
        // Provide more specific error messages for admin logins
        if (isAdmin && err.response?.status === 403) {
          errorMessage = 'Admin access denied. Please check your admin privileges.';
        } else if (isAdmin && err.response?.status === 404) {
          errorMessage = 'Admin account not found. Please contact support.';
        }
        
        // Log the error for debugging
        console.error('Auth error details:', {
          role,
          error: err,
          isAdmin,
          timestamp: new Date().toISOString()
        });
        
        // Redirect to signup page with error
        navigate('/signup', { 
          state: { 
            error: errorMessage
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