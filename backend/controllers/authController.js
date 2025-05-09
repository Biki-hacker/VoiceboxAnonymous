// controllers/authController.js
const User = require('../models/User');
const Organization = require('../models/Organization');

// Register user (called from SignUp.jsx)
exports.registerUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Missing email or role' });
    }
    
    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(200).json({ success: true, message: 'Already registered' });
    }
    
    // Create new user
    const user = new User({ 
      email, 
      role, 
      organizationId: null, 
      verificationParams: {}, 
      verified: role === 'admin' // Auto-verify admins
    });
    await user.save();
    
    console.log(`✅ [registerUser] ${email} → ${role}`);
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ [registerUser] error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Employee verifies their identity after sign in
exports.verifyEmployee = async (req, res) => {
  try {
    const { organizationId, verificationParams, email } = req.body;
    
    if (!email || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing email or organization ID' 
      });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    
    // If organization has verification fields, validate them
    if (organization.verificationFields && organization.verificationFields.length > 0) {
      // Check if all required verification fields are provided
      const missingFields = organization.verificationFields.filter(
        field => !verificationParams || !verificationParams[field]
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing verification fields: ${missingFields.join(', ')}`
        });
      }
    }
    
    // Update user with organization and verification info
    user.organizationId = organizationId;
    user.verificationParams = verificationParams || {};
    user.verified = true;
    await user.save();
    
    console.log(`✅ [verifyEmployee] ${email} verified for organization ${organizationId}`);
    return res.status(200).json({ 
      success: true, 
      userId: user._id,
      message: 'Verification successful'
    });
  } catch (err) {
    console.error('❌ verifyEmployee error', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Check verification status and role (used in SignIn)
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        verified: false 
      });
    }
    
    return res.status(200).json({
      success: true,
      verified: user.verified,
      orgId: user.organizationId,
      role: user.role
    });
  } catch (err) {
    console.error('❌ checkVerificationStatus error', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Optional: Webhook handler (no longer needed but kept for backward compatibility)
exports.handleSupabaseWebhook = async (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: 'Webhook received but not processed' 
  });
};