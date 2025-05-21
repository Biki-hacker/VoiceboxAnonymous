// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find user
    const user = await User.findById(decoded.userId)
      .select('_id email role organizationId verified');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is verified (skip for admin users)
    if (!user.verified && user.role !== 'admin') {
      return res.status(403).json({ message: 'Account not verified' });
    }

    // Attach user to request
    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = authMiddleware;