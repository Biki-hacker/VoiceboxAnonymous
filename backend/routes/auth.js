const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, organizationId, isOAuth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // For OAuth users, we don't need a password
    const userData = {
      email,
      role,
      organizationId,
      isOAuth: !!isOAuth
    };

    // Only include password if provided (for non-OAuth users)
    if (password) {
      userData.password = password;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set refresh token as HTTP-only cookie
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isOAuth: user.isOAuth,
        verified: user.verified
      }, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message,
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login user with Supabase
router.post('/login', async (req, res) => {
  console.log('Login request received:', { 
    body: { ...req.body, supabaseToken: req.body.supabaseToken ? '***' : 'missing' },
    headers: req.headers
  });

  try {
    const { email, supabaseToken } = req.body;

    if (!email || !supabaseToken) {
      console.error('Missing required fields:', { email, hasToken: !!supabaseToken });
      return res.status(400).json({ 
        success: false,
        error: 'Email and Supabase token are required',
        code: 'MISSING_FIELDS'
      });
    }

    console.log('Verifying Supabase token...');
    try {
      // Verify the Supabase token
      const { createClient } = require('@supabase/supabase-js');
      
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables');
        return res.status(500).json({
          success: false,
          error: 'Server configuration error',
          code: 'SERVER_CONFIG_ERROR'
        });
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Get the user from Supabase
      console.log('Getting user from Supabase...');
      const { data: supabaseData, error: supabaseError } = await supabase.auth.getUser(supabaseToken);
      
      if (supabaseError || !supabaseData?.user) {
        console.error('Supabase auth error:', {
          error: supabaseError,
          hasUser: !!supabaseData?.user,
          email
        });
        return res.status(401).json({ 
          success: false,
          error: 'Invalid or expired authentication token',
          code: 'INVALID_AUTH_TOKEN'
        });
      }

      console.log('Supabase user verified:', { 
        userId: supabaseData.user.id,
        email: supabaseData.user.email
      });

      // Check if user exists in our database
      console.log('Looking up local user:', email);
      let localUser = await User.findOne({ email });
      
      // If user doesn't exist and this is an OAuth login, create the user
      if (!localUser && req.body.isOAuth) {
        console.log('Creating new OAuth user:', email);
        
        // Get role from the request or default to 'employee'
        const role = req.body.role || 'employee';
        
        // Create new user without a password
        localUser = new User({
          email,
          role,
          isOAuth: true,
          verified: true // Mark OAuth users as verified by default
        });
        
        await localUser.save();
        console.log('Created new OAuth user:', localUser);
      } else if (!localUser) {
        // If user doesn't exist and this is not an OAuth login
        console.error('Local user not found and not an OAuth login:', email);
        return res.status(404).json({ 
          success: false,
          error: 'User not found. Please register first.',
          code: 'USER_NOT_FOUND'
        });
      }

      console.log('Local user found:', { 
        userId: localUser._id,
        role: localUser.role,
        verified: localUser.verified
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: localUser._id },
        process.env.JWT_SECRET || 'default-secret-key', // Fallback for development only
        { expiresIn: '24h' }
      );

      // Update last login
      localUser.lastLogin = new Date();
      await localUser.save();

      // Return user data without sensitive information
      const userData = {
        _id: localUser._id,
        email: localUser.email,
        role: localUser.role,
        organizationId: localUser.organizationId,
        verified: localUser.verified
      };

      console.log('Login successful for user:', { 
        userId: localUser._id,
        email: localUser.email,
        role: localUser.role
      });

      // Return response in the format expected by the frontend
      return res.json({
        success: true,
        token,
        role: localUser.role,
        verified: localUser.verified,
        orgId: localUser.organizationId,
        user: {
          _id: localUser._id,
          email: localUser.email,
          role: localUser.role,
          organizationId: localUser.organizationId,
          verified: localUser.verified
        }
      });

    } catch (supabaseError) {
      console.error('Error during Supabase authentication:', {
        error: supabaseError.message,
        stack: supabaseError.stack
      });
      return res.status(500).json({
        success: false,
        error: 'Error during authentication',
        code: 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
      });
    }
  } catch (error) {
    console.error('Unexpected error in login route:', {
      error: error.message,
      stack: error.stack,
      request: {
        body: req.body,
        headers: req.headers
      }
    });
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    // Since we're using JWT, we don't need to do anything server-side for logout
    // The client should remove the token from storage
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Verify authentication status
router.get('/verify-status', auth, async (req, res) => {
  try {
    // If we get here, the auth middleware has already verified the token
    // and attached the user to the request
    res.json({
      authenticated: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 