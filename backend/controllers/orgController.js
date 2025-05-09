// backend/controllers/orgController.js
const Organization = require('../models/Organization');

exports.getOrgByAdminId = async (req, res) => {
  try {
    // Get admin email from query params (as used in the frontend)
    const adminEmail = req.query.email || req.params.adminEmail;
    
    if (!adminEmail) {
      return res.status(400).json({ message: 'Admin email is required' });
    }

    const orgs = await Organization.find({ adminEmail });
    
    // Return empty array instead of 404 when no organizations found
    // This aligns with the frontend expectation to handle empty states
    return res.json(orgs);
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ message: 'Error fetching organizations' });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, adminEmail } = req.body;
    
    if (!name || !adminEmail) {
      return res.status(400).json({ message: 'Name and admin email are required' });
    }
    
    const newOrg = new Organization({
      name,
      adminEmail,
      verificationFields: [] // Initialize with empty array
    });
    
    const savedOrg = await newOrg.save();
    res.status(201).json(savedOrg);
  } catch (err) {
    console.error('Error creating organization:', err);
    
    // Handle duplicate organization name error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An organization with this name already exists' });
    }
    
    res.status(500).json({ message: 'Error creating organization' });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const updates = req.body;
    
    const updatedOrg = await Organization.findByIdAndUpdate(
      orgId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedOrg) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json(updatedOrg);
  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ message: 'Error updating organization' });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const deletedOrg = await Organization.findByIdAndDelete(orgId);
    
    if (!deletedOrg) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json({ message: 'Organization deleted successfully' });
  } catch (err) {
    console.error('Error deleting organization:', err);
    res.status(500).json({ message: 'Error deleting organization' });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const org = await Organization.findById(orgId);
    
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json(org);
  } catch (err) {
    console.error('Error fetching organization:', err);
    res.status(500).json({ message: 'Error fetching organization' });
  }
};

// Legacy method for backward compatibility
exports.updateVerificationParams = async (req, res) => {
  try {
    const { adminEmail } = req.params;
    const { verificationSchema } = req.body;
    
    const updated = await Organization.findOneAndUpdate(
      { adminEmail },
      { verificationFields: verificationSchema }, // Changed to match frontend field name
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating verification schema:', err);
    res.status(500).json({ message: 'Error updating verification schema' });
  }
};