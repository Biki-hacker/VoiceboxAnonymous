// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');
const {
  registerUser,
  verifyEmployee,
  checkVerificationStatus 
} = require('../controllers/authController');

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
        message: 'Email and Supabase token are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Verify Supabase token
    const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.getUser(supabaseToken);
    
    if (supabaseError || !supabaseUser || supabaseUser.email !== email) {
      return res.status(401).json({ 
        message: 'Invalid Supabase token' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      token,
      role: user.role,
      verified: user.verified,
      orgId: user.organizationId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Direct registration (after Supabase signup)
router.post('/register', registerUser);

// Employee verification
router.post('/verify', verifyEmployee);

// Check status + role
router.get('/verify-status', checkVerificationStatus);

module.exports = router;