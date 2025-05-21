const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, organizationId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      organizationId
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
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