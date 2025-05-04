const User = require('../models/User');

exports.verifyEmployee = async (req, res) => {
  try {
    const { organizationId, verificationParams } = req.body;

    // Query using nested matching logic
    const match = await User.findOne({
      organizationId,
      ...Object.entries(verificationParams).reduce((acc, [key, val]) => {
        acc[`verificationParams.${key}`] = val;
        return acc;
      }, {})
    });

    if (match) return res.status(200).json({ success: true, userId: match._id });

    res.status(401).json({ success: false, message: 'Verification failed' });
  } catch (err) {
    console.error('verifyEmployee error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
