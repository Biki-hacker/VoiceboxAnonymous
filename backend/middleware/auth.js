// backend/middleware/auth.js
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get credentials from secure httpOnly cookie
    const sessionToken = req.cookies.session_token;
    
    if (!sessionToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify session in database
    const user = await User.findOne({
      'sessions.token': sessionToken,
      'sessions.expiresAt': { $gt: new Date() }
    }).select('_id email role organizationId');

    if (!user) {
      return res.status(401).clearCookie('session_token').json({ 
        message: 'Invalid or expired session' 
      });
    }

    // Attach user to request
    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = authMiddleware;