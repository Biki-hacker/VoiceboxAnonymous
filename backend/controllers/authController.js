// controllers/authController.js
const User = require('../models/User');

// Webhook triggered by Supabase signup
exports.handleSupabaseWebhook = async (req, res) => {
  try {
    console.log("🔔 Supabase webhook received");

    const record = req.body.record || {};
    const email = record.email;
    // Supabase auth insert payload uses raw_user_meta_data for custom fields
    const meta = record.raw_user_meta_data || record.user_metadata || {};
    const role = meta.role;

    if (!email || !role) {
      console.warn('Missing email or role in webhook payload', { email, role });
      return res.status(400).json({ success: false, message: 'Missing email or role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️ User already exists: ${email}`);
      return res.status(200).json({ success: true, message: 'User already exists' });
    }

    const newUser = new User({
      email,
      role,
      organizationId: null,
      verificationParams: {},
      verified: false
    });

    await newUser.save();
    console.log(`✅ User inserted into MongoDB: ${email} (${role})`);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).json({ success: false, message: 'Webhook failed' });
  }
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

    res.status(200).json({ success: true, userId: user._id });
  } catch (err) {
    console.error('verifyEmployee error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check if the user is already verified (used in SignIn)
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ verified: false });
    }

    return res.status(200).json({ verified: user.verified, orgId: user.organizationId });
  } catch (err) {
    console.error('checkVerificationStatus error:', err);
    res.status(500).json({ verified: false, error: 'Internal server error' });
  }
};
