// backend/controllers/orgController.js
const Organization = require('../models/Organization');

exports.getOrgByAdminId = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminId: req.params.adminId });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching organization' });
  }
};

exports.updateVerificationParams = async (req, res) => {
  try {
    const updated = await Organization.findOneAndUpdate(
      { adminId: req.params.adminId },
      { verificationParams: req.body.verificationParams },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating verification params' });
  }
};
