// backend/controllers/authController.js
const User = require('../models/User');

// Verify employee by matching organization and verification parameters
exports.verifyEmployee = async (req, res) => {
  try {
    const { organizationId, verificationParams, email } = req.body;

    const query = {
      organizationId,
      email,
      ...Object.entries(verificationParams).reduce((acc, [key, val]) => {
        acc[`verificationParams.${key}`] = val;
        return acc;
      }, {})
    };

    const existingUser = await User.findOne(query);

    if (existingUser) {
      existingUser.verified = true;
      await existingUser.save();
      return res.status(200).json({ success: true, userId: existingUser._id });
    }

    res.status(401).json({ success: false, message: 'Verification failed' });
  } catch (err) {
    console.error('verifyEmployee error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Check if employee is already verified
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ verified: false });
    res.json({ verified: user.verified, orgId: user.organizationId });
  } catch (err) {
    console.error("Verification status check error:", err);
    res.status(500).json({ verified: false });
  }
};

// GET /auth/verify-status?email=example@email.com
exports.checkVerificationStatus = async (req, res) => {
  try {
    const email = req.query.email;
    const user = await User.findOne({ 'verificationParams.email': email });

    if (user) {
      return res.status(200).json({ verified: true, orgId: user.organizationId });
    } else {
      return res.status(200).json({ verified: false });
    }
  } catch (err) {
    console.error('checkVerificationStatus error:', err);
    res.status(500).json({ verified: false, error: 'Internal error' });
  }
};

// webhook triggered after signup
exports.handleSupabaseWebhook = async (req, res) => {
  try {
    const event = req.body;
    const { email, user_metadata } = event.record;

    const role = user_metadata?.role;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Missing role in metadata' });
    }

    const newUser = new User({
      email,
      role,
      verificationParams: {}, // can be updated later by employee
      organizationId: null    // can be updated later by verification
    });

    await newUser.save();
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, message: 'Webhook failed' });
  }
};
