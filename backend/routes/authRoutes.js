// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Login user with Supabase
router.post('/login', async (req, res) => {
  try {
    const { email, supabaseToken } = req.body;

    if (!email || !supabaseToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and Supabase token are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Verify Supabase token
    let supabaseUser;
    try {
      const result = await supabase.auth.getUser(supabaseToken);
      supabaseUser = result?.data?.user;
    } catch (supabaseError) {
      console.error('Supabase token verification failed:', supabaseError);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired Supabase token' 
      });
    }
    
    if (!supabaseUser || supabaseUser.email !== email) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication failed' 
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update user's last login
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const response = {
      success: true,
      token: accessToken,
      role: user.role,
      verified: user.verified
    };

    // Only include orgId if it exists
    if (user.organizationId) {
      response.orgId = user.organizationId.toString();
    }

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token: accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    // Clear invalid refresh token
    res.clearCookie('refreshToken');
    
    const message = error.name === 'JsonWebTokenError' 
      ? 'Invalid token' 
      : 'Failed to refresh token';
      
    res.status(401).json({
      success: false,
      message
    });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
router.get('/me', (req, res, next) => {
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    authController.getCurrentUser(req, res, next).catch(next);
  });
});

// Direct registration (after Supabase signup)
router.post('/register', (req, res, next) => {
  authController.registerUser(req, res, next).catch(next);
});

// Employee verification
router.post('/verify', (req, res, next) => {
  authController.verifyEmployee(req, res, next).catch(next);
});

// Check verification status
router.get('/verify-status', authController.checkVerificationStatus);

// Verify employee email
router.post('/verify-email', authController.verifyEmployeeEmail);

module.exports = router;