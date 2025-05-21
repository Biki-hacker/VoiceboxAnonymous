const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
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
    
    // Generate JWT token after successful verification
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({ 
      success: true, 
      userId: user._id,
      token,
      role: user.role,
      organizationId: user.organizationId
    });
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
    
    // Generate new token if user is verified
    const token = user.verified ? jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    ) : null;
    
    return res.status(200).json({
      success: true,
      verified: user.verified,
      orgId: user.organizationId,
      role: user.role,
      userId: user._id,
      token
    });
  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};