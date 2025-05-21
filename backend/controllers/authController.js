const User = require('../models/User');
const Organization = require('../models/Organization');
const { createSession } = require('../utils/session');

exports.registerUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Missing email or role' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(200).json({ success: true, message: 'Already registered' });
    }
    
    const user = new User({ 
      email, 
      role,
      sessions: [],
      organizationId: null, 
      verificationParams: {}, 
      verified: role === 'admin'
    });
    
    await user.save();
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyEmployee = async (req, res) => {
  try {
    const { organizationId, verificationParams, email } = req.body;
    
    if (!email || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing email or organization ID' 
      });
    }
    
    const user = await User.findOne({ email });
    const organization = await Organization.findById(organizationId);
    
    if (!user || !organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'User or organization not found' 
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
    
    return res.status(200).json({ success: true, userId: user._id });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    return res.status(200).json({
      success: true,
      verified: user.verified,
      orgId: user.organizationId,
      role: user.role,
      userId: user._id
    });
  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};