// controllers/authController.js
const User = require('../models/User');

// New: register user (called from SignUp.jsx)
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
    const user = new User({ email, role, organizationId: null, verificationParams: {}, verified: false });
    await user.save();
    console.log(`✅ [registerUser] ${email} → ${role}`);
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ [registerUser] error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// (Optional) you can leave webhook handling, but it's no longer required for role persistence
exports.handleSupabaseWebhook = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Webhook disabled in favor of direct register.' });
};

// Employee verifies their identity after sign in
exports.verifyEmployee = async (req, res) => {
  try {
    const { organizationId, verificationParams, email } = req.body;
    if (!email || !organizationId) {
      return res.status(400).json({ success: false, message: 'Missing email or org ID' });
    }
    const query = {
      email,
      organizationId,
      ...Object.entries(verificationParams).reduce((acc, [k, v]) => {
        acc[`verificationParams.${k}`] = v;
        return acc;
      }, {})
    };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Verification failed' });
    }
    user.verified = true;
    await user.save();
    return res.status(200).json({ success: true, userId: user._id });
  } catch (err) {
    console.error('❌ verifyEmployee error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check verification *and* role (used in SignIn)
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ verified: false });
    }
    return res.status(200).json({
      verified: user.verified,
      orgId: user.organizationId,
      role: user.role
    });
  } catch (err) {
    console.error('❌ checkVerificationStatus error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
