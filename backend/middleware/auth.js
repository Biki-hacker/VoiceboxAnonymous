// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Rate limiting for auth attempts
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Rate limiting middleware for auth routes
const authLimiter = rateLimit({
  windowMs: 2 * 60 * 60 * 1000, // 2 hours
  max: 1000, // limit each IP to 1000 requests per 2 hour window
  message: { 
    success: false, 
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true // only count failed requests
});

// Slow down after 500 requests in 2 hours
const speedLimiter = slowDown({
  windowMs: 2 * 60 * 60 * 1000, // 2 hours
  delayAfter: 500, // allow 500 requests per 2 hours before slowing down
  delayMs: (used, req) => (used - req.slowDown.limit) * 100, // add 100ms delay per request above the limit
  maxDelayMs: 1000, // maximum delay of 1 second
  validate: { delayMs: false } // disable validation warning
});

const authMiddleware = async (req, res, next) => {
  try {
    // Skip auth for health check and public routes
    if (req.path === '/health' || req.path === '/auth/refresh-token') {
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      // Find user in database
      const user = await User.findById(decoded.userId)
        .select('_id email role organizationId verified lastLogin lastPasswordChange')
        .lean();

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }


      // Check if user is verified (skip for admin users)
      if (!user.verified && user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Account not verified. Please verify your email.',
          code: 'ACCOUNT_NOT_VERIFIED'
        });
      }

      // Check if token was issued before last password change
      if (user.lastPasswordChange && decoded.iat * 1000 < user.lastPasswordChange.getTime()) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Attach user to request
      req.user = {
        _id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        verified: user.verified
      };
      req.token = token;

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      throw error; // Pass other errors to the global error handler
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Don't expose internal errors to client
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Authentication failed';
      
    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      code: 'AUTH_ERROR'
    });
  }
};

// Higher-order function to handle role-based access
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  authLimiter,
  speedLimiter
};