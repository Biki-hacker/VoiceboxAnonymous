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
    next(error);
  }
};

const checkVerificationStatus = async (req, res, next) => {
  try {
    // Get email from either authenticated user or query params
    const email = req.user?.email || req.query.email;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // If user is already verified, return success with user data
    if (user.verified) {
      return res.json({
        success: true,
        verified: true,
        message: 'User is already verified',
        data: {
          role: user.role,
          organizationId: user.organizationId,
          email: user.email,
          verified: user.verified
        }
      });
    }

    // Check if user has an organization
    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId);
      if (org) {
        // Check if email is in the allowed list
        const isEmailAuthorized = org.employeeEmails?.some(
          emp => emp.email.toLowerCase() === email.toLowerCase()
        );

        if (isEmailAuthorized) {
          // Email is authorized, verify the user
          user.verified = true;
          await user.save();
          
          return res.json({
            success: true,
            verified: true,
            message: 'Email verified successfully',
            data: {
              role: user.role,
              organizationId: user.organizationId,
              email: user.email,
              verified: true
            }
          });
        }
        
        // Email not in the allowed list
        return res.status(403).json({
          success: false,
          verified: false,
          message: 'Your email is not authorized for this organization',
          code: 'UNAUTHORIZED_EMAIL'
        });
      }
    }

    // If no organization is required, mark as verified
    if (!user.organizationId) {
      user.verified = true;
      await user.save();
      
      return res.json({
        success: true,
        verified: true,
        message: 'User verified successfully',
        requiresVerification: false,
        data: {
          role: user.role,
          organizationId: user.organizationId,
          email: user.email,
          verified: true
        }
      });
    }

    // If we get here, the user is not verified and needs to be verified
    res.json({
      success: true,
      verified: false,
      message: 'Email verification required',
      requiresVerification: true,
      data: {
        role: user.role,
        organizationId: user.organizationId,
        email: user.email,
        verified: false
      }
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    next(error);
  }
};

// Verify employee email against organization's allowed emails
const verifyEmployeeEmail = async (req, res, next) => {
  try {
    const { email, organizationId } = req.body;

    // Validate input
    if (!email || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Email and organization ID are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Check if email is in the allowed list
    const isEmailAuthorized = organization.employeeEmails?.some(
      emp => emp.email.toLowerCase() === email.toLowerCase()
    );

    if (!isEmailAuthorized) {
      return res.status(403).json({
        success: false,
        verified: false,
        message: 'Your email is not authorized for this organization',
        code: 'UNAUTHORIZED_EMAIL'
      });
    }

    // Find or create the user
    let user = await User.findOne({ email });
    const isNewUser = !user;
    
    if (isNewUser) {
      // Create a new user if they don't exist
      user = new User({
        email,
        role: 'employee',
        organizationId,
        verified: true
      });
      await user.save();
    } else {
      // Update existing user
      user.organizationId = organizationId;
      user.verified = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      verified: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isVerified: user.verified
      },
      organization: {
        id: organization._id,
        name: organization.name
      }
    });
  } catch (error) {
    console.error('Error verifying employee email:', error);
    next(error);
  }
};

// Export all controller functions
module.exports = {
  getCurrentUser,
  registerUser,
  verifyEmployee,
  checkVerificationStatus,
  verifyEmployeeEmail
};