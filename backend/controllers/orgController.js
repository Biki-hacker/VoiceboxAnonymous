// backend/controllers/orgController.js
const Organization = require('../models/Organization');

exports.getOrgByAdminId = async (req, res) => {
  try {
    const loggedInAdminEmail = req.user.email;

    // For the legacy route /admin/:adminEmail, or if ?email=... is provided on /by-admin
    if (req.params.adminEmail && req.params.adminEmail !== loggedInAdminEmail) {
      return res.status(403).json({ message: 'Access denied: You can only fetch your own organizations.' });
    }
    if (req.query.email && req.query.email !== loggedInAdminEmail) {
      return res.status(403).json({ message: 'Access denied: You can only fetch your own organizations.' });
    }

    // If we reach here, we use the logged-in user's email
    const orgs = await Organization.find({ adminEmail: loggedInAdminEmail });
    
    return res.json(orgs);
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ message: 'Error fetching organizations' });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body; // adminEmail will be taken from authenticated user
    const adminEmail = req.user.email; // Set adminEmail from authenticated user
    
    if (!name) { // Only name is required from body now
      return res.status(400).json({ message: 'Organization name is required' });
    }
    
    const newOrg = new Organization({
      name,
      adminEmail, // Use authenticated user's email
      verificationFields: []
    });
    
    const savedOrg = await newOrg.save();
    res.status(201).json(savedOrg);
  } catch (err) {
    console.error('Error creating organization:', err);
    
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

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Authorization check
    if (organization.adminEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to update this organization.' });
    }
    
    // Prevent adminEmail from being updated directly via this route for now
    // If adminEmail change is needed, it should be a separate, more controlled process.
    if (updates.adminEmail && updates.adminEmail !== organization.adminEmail) {
        delete updates.adminEmail; // Or return an error, e.g., res.status(400).json({ message: 'Cannot change adminEmail via this endpoint.' });
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      orgId,
      updates,
      { new: true, runValidators: true }
    );
    
    // findByIdAndUpdate returns null if not found, but we already checked.
    // However, it's good practice to keep this check in case of race conditions or other issues.
    if (!updatedOrg) {
        // This case should ideally not be hit if the first check passed and no deletion happened in between.
        return res.status(404).json({ message: 'Organization not found during update.' });
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

    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Authorization check
    if (organization.adminEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to delete this organization.' });
    }
    
    await Organization.findByIdAndDelete(orgId);
    
    res.json({ message: 'Organization deleted successfully' });
  } catch (err) {
    console.error('Error deleting organization:', err);
    res.status(500).json({ message: 'Error deleting organization' });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const { orgId } = req.params;
    
    // Fetch the organization but exclude the adminEmail field
    const org = await Organization.findById(orgId).select('-adminEmail');
    
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json(org);
  } catch (err) {
    console.error('Error fetching organization:', err);
    res.status(500).json({ message: 'Error fetching organization' });
  }
};

// New endpoint to search for organizations by name or ID
exports.searchOrganization = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let org = null;

    // First try to find by ID (if the query looks like a MongoDB ID)
    if (query.match(/^[0-9a-fA-F]{24}$/)) {
      org = await Organization.findById(query);
    }

    // If not found by ID, try to find by name
    if (!org) {
      // Use case-insensitive search for name
      org = await Organization.findOne({ 
        name: { $regex: new RegExp(query, 'i') }
      });
    }
    
    if (!org) {
      return res.status(404).json({ message: 'No organization found matching your search' });
    }
    
    res.json(org);
  } catch (err) {
    console.error('Error searching organization:', err);
    res.status(500).json({ message: 'Error searching organization' });
  }
};

// Legacy method for backward compatibility
exports.updateVerificationParams = async (req, res) => {
  try {
    const { adminEmail: pathAdminEmail } = req.params; // Email from URL path
    const loggedInAdminEmail = req.user.email;      // Email of authenticated user
    const { verificationSchema } = req.body;

    // Authorization check: User can only update params for their own organization
    if (pathAdminEmail !== loggedInAdminEmail) {
      return res.status(403).json({ message: 'Access denied: You can only update verification parameters for your own organization.' });
    }
    
    const updated = await Organization.findOneAndUpdate(
      { adminEmail: loggedInAdminEmail }, // Query by the (now verified) adminEmail
      { verificationFields: verificationSchema }, 
      { new: true }
    );
    
    if (!updated) {
      // This implies an organization with loggedInAdminEmail was not found, which is unexpected if the user exists.
      return res.status(404).json({ message: 'Organization not found for your account.' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating verification schema:', err);
    res.status(500).json({ message: 'Error updating verification schema' });
  }
};