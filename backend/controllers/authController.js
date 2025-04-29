const User = require('../models/User');

exports.verifyEmployee = async (req, res) => {
  try {
    const { organizationId, verificationParams } = req.body;

    const match = await User.findOne({ organizationId, verificationParams });
    if (match) return res.status(200).json({ verified: true });

    res.status(401).json({ verified: false });
  } catch (err) {
    console.error('verifyEmployee error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
