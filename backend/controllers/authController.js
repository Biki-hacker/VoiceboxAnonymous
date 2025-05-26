const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    // The user is attached to the request by the auth middleware
    const user = req.user;
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // Return user data without sensitive information
    const userData = {
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isVerified: user.verified
      }
    };
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { email, password, role, organizationId } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      organizationId
    });

    await user.save();

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
      { expiresIn: '7d' }
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        accessToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

const verifyEmployee = async (req, res, next) => {
  try {
    const { email, organizationId, verificationParams } = req.body;
    
    if (!email || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing email or organization ID',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const user = await User.findOne({ email });
    const organization = await Organization.findById(organizationId);
    
    if (!user || !organization) {
      return res.status(404).json({ 
        success: false,
        message: 'User or organization not found',
        code: 'USER_OR_ORGANIZATION_NOT_FOUND'
      });
    }

    if (organization.verificationFields?.length > 0) {
      const missingFields = organization.verificationFields.filter(
        field => !verificationParams?.[field]
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing verification fields: ${missingFields.join(', ')}`
        });
      }
    }
    
    user.organizationId = organizationId;
    user.verificationParams = verificationParams || {};
    user.verified = true;
    await user.save();
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
      { expiresIn: '7d' }
    );
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.json({ 
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        verified: user.verified,
        accessToken
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    throw new Error('Verification failed');
  }
};

const checkVerificationStatus = async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Only generate a token if the user is verified
    let accessToken = null;
    if (user.verified) {
      accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
    }
    
    return res.status(200).json({
      success: true,
      data: {
        verified: user.verified,
        organizationId: user.organizationId,
        role: user.role,
        userId: user._id,
        accessToken
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    next(error);
  }
};

// Export all controller functions
module.exports = {
  getCurrentUser,
  registerUser,
  verifyEmployee,
  checkVerificationStatus
};