// backend/controllers/orgController.js
const Organization = require('../models/Organization');

exports.getOrgByAdminId = async (req, res) => {
  try {
    const orgs = await Organization.find({ adminEmail: req.params.adminEmail });
    if (!orgs.length) return res.status(404).json({ message: 'No organizations found' });
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching organizations' });
  }
};

exports.updateVerificationParams = async (req, res) => {
  try {
    const updated = await Organization.findOneAndUpdate(
      { adminEmail: req.params.adminEmail },
      { verificationSchema: req.body.verificationSchema },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating verification schema' });
  }
};
