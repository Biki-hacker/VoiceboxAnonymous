// backend/controllers/orgController.js
const Organization = require('../models/Organization');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { 
  validateOrgId, 
  validateEmailParam,
  handleValidationErrors,
  validateEmployeeEmails,
  validateCoAdminEmails
} = require('../middleware/validation');

// Middleware to check if user is an admin or co-admin of the organization
const checkOrgAdminOrCoAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;
    
    // Find the organization
    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Check if the current user is the admin of this organization
    const isAdmin = org.adminId.toString() === userId.toString();
    
    // Check if the current user is a co-admin of this organization
    const isCoAdmin = org.coAdminEmails.some(
      emailObj => emailObj.normalizedEmail === userEmail.toLowerCase()
    );
    
    if (!isAdmin && !isCoAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Attach organization and user role to request for use in route handlers
    req.organization = org;
    req.userRole = isAdmin ? 'admin' : 'co-admin';
    next();
  } catch (error) {
    console.error('Error in checkOrgAdminOrCoAdmin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware to check if user is an admin of the organization
const checkOrgAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the organization
    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Check if the current user is the admin of this organization
    if (org.adminId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Attach organization to request for use in route handlers
    req.organization = org;
    next();
  } catch (error) {
    console.error('Error in checkOrgAdmin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};



/**
 * Get organizations by admin ID
 * @route GET /api/organizations/by-admin
 * @route GET /api/organizations/admin/:adminId
 * @access Private
 */
exports.getOrgByAdminId = async (req, res) => {
  try {
    console.log('[getOrgByAdminId] Request received:', {
      user: req.user ? 'Authenticated' : 'Not authenticated',
      query: req.query,
      method: req.method,
      url: req.originalUrl
    });

    let query = {};
    
    // First try to get adminId from authenticated user
    if (req.user?._id) {
      console.log('[getOrgByAdminId] Using authenticated user ID:', req.user._id);
      query.adminId = req.user._id;
    } 
    // Fallback to email parameter if provided
    else if (req.query.email) {
      console.log('[getOrgByAdminId] Looking up user by email:', req.query.email);
      // Find user by email to get their ID
      const user = await User.findOne({ email: req.query.email }).select('_id');
      if (!user) {
        console.log('[getOrgByAdminId] User not found for email:', req.query.email);
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      console.log('[getOrgByAdminId] Found user ID:', user._id);
      query.adminId = user._id;
    } else {
      console.log('[getOrgByAdminId] No user identifier provided');
      return res.status(400).json({
        success: false,
        message: 'No user identifier provided',
        code: 'MISSING_USER_IDENTIFIER'
      });
    }

    console.log('[getOrgByAdminId] Querying organizations with:', query);
    
    // Find all organizations where the user is an admin
    const orgs = await Organization.find(query)
      .select('-__v -employeeEmails._id')
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();
    
    // Ensure we always return an array, even if empty
    const responseData = Array.isArray(orgs) ? orgs : [];
    
    console.log(`[getOrgByAdminId] Found ${responseData.length} organizations`);
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching organizations by admin ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch organizations',
      code: 'SERVER_ERROR',
      error: error.message 
    });
  }
};

/**
 * Update employee emails for an organization
 * @route PUT /api/organizations/:orgId/emails
 * @access Private (Admin only)
 */
exports.updateEmployeeEmails = async (req, res) => {
  try {
    const { orgId } = req.params; // Changed from id to orgId to match route parameter
    const userId = req.user._id;
    
    console.log('Updating emails for organization:', { orgId, userId });
    
    // Find the organization
    const org = await Organization.findById(orgId);
    if (!org) {
      console.error('Organization not found:', orgId);
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND',
        orgId: orgId // Include the orgId in the response for debugging
      });
    }
    
    // Check if user is the admin of this organization
    if (org.adminId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this organization',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Log the incoming validated emails
    console.log('Received validated emails from middleware:', JSON.stringify(req.validatedEmails || [], null, 2));
    
    // Update the employee emails with validated data from the middleware
    org.employeeEmails = (req.validatedEmails || []).map(email => ({
      email: email.email, // Preserve original email
      normalizedEmail: email.normalizedEmail || email.email.toLowerCase(),
      verificationToken: email.verificationToken || uuidv4(),
      isVerified: email.isVerified || false,
      addedAt: email.addedAt || new Date()
    }));
    
    org.updatedAt = new Date();
    
    console.log('About to save organization with emails:', JSON.stringify({
      employeeEmails: org.employeeEmails,
      updatedAt: org.updatedAt
    }, null, 2));
    
    await org.save();
    
    console.log('Successfully updated employee emails. Final state:', JSON.stringify({
      employeeEmails: org.employeeEmails,
      updatedAt: org.updatedAt
    }, null, 2));
    
    // Prepare response data without sensitive information
    const responseData = {
      id: org._id,
      name: org.name,
      emailCount: org.employeeEmails.length,
      updatedAt: org.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: 'Employee emails updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating employee emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee emails',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};

/**
 * Get employee emails for an organization
 * @route GET /api/organizations/:orgId/emails
 * @access Private (Admin only)
 */
exports.getEmployeeEmails = async (req, res) => {
  try {
    const { orgId } = req.params; // Changed from id to orgId to match route parameter
    const userId = req.user._id;
    
    console.log('Getting employee emails for organization:', { orgId, userId });
    
    // Find the organization
    const org = await Organization.findById(orgId)
      .select('adminId employeeEmails name')
      .lean();
      
    if (!org) {
      console.error('Organization not found:', orgId);
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Check if user is the admin of this organization
    if (org.adminId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this information',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Prepare response data
    const responseData = {
      organization: {
        id: org._id,
        name: org.name,
        emailCount: org.employeeEmails.length
      },
      emails: org.employeeEmails.map(email => ({
        email: email.email,
        addedAt: email.addedAt,
        isVerified: email.isVerified
      }))
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching employee emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee emails',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};

/**
 * Check if an email is verified for an organization
 * @route GET /api/organizations/:orgId/verify-email
 * @access Public
 */
exports.checkEmailVerification = async (req, res) => {
  try {
    console.log('Email verification request received:', {
      params: req.params,
      query: req.query,
      headers: req.headers
    });
    
    const { orgId } = req.params;
    const { email } = req.query;
    
    console.log('Processing verification for:', { orgId, email });
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }
    
    // Ensure we have a valid email string
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required',
        code: 'INVALID_EMAIL'
      });
    }
    
    // Trim and normalize the email for lookup
    const emailStr = email.trim();
    const normalizedEmail = emailStr.toLowerCase();
    
    // Find the organization
    const org = await Organization.findById(orgId)
      .select('name employeeEmails')
      .lean();
      
    if (!org) {
      console.error('Organization not found:', orgId);
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Find the email record (case-insensitive comparison)
    const emailRecord = org.employeeEmails.find(
      emp => emp.normalizedEmail === normalizedEmail
    );
    
    console.log('Email verification details:', {
      inputEmail: email,
      normalizedForLookup: normalizedEmail,
      found: !!emailRecord,
      storedEmail: emailRecord?.email
    });
    
    const isEmailAuthorized = !!emailRecord;
    
    // Prepare response data
    const responseData = {
      isVerified: isEmailAuthorized,
      organization: {
        id: org._id,
        name: org.name
      },
      email: emailRecord?.email || trimmedEmail
    };
    
    // If email is found, include additional verification details
    if (emailRecord) {
      responseData.verificationDetails = {
        addedAt: emailRecord.addedAt,
        isVerified: emailRecord.isVerified || false
      };
    }
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error checking email verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email verification status',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};

/**
 * Legacy method for backward compatibility
 * @deprecated Use updateEmployeeEmails instead
 */
exports.updateVerificationParams = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { params } = req.body;
    
    if (!params || typeof params !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Verification parameters are required',
        code: 'INVALID_INPUT'
      });
    }
    
    // Find and update organization
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Update verification parameters
    org.verificationFields = Object.entries(params).map(([key, label]) => ({
      key,
      label,
      type: 'text' // Default type
    }));
    
    await org.save();
    
    res.status(200).json({
      success: true,
      message: 'Verification parameters updated successfully',
      data: {
        id: org._id,
        paramCount: org.verificationFields.length
      }
    });
  } catch (error) {
    console.error('Error updating verification parameters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification parameters',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    const adminEmail = req.user.email;
    const adminId = req.user._id;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Organization name is required',
        code: 'MISSING_NAME'
      });
    }
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin user ID is required',
        code: 'MISSING_ADMIN_ID'
      });
    }
    
    const newOrg = new Organization({
      name,
      adminId,      // Store the admin's user ID
      adminEmail,   // Store the admin's email for reference
      verificationFields: []
    });
    
    const savedOrg = await newOrg.save();
    
    // Return the created organization without sensitive fields
    const { __v, ...orgData } = savedOrg.toObject();
    
    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: orgData
    });
  } catch (err) {
    console.error('Error creating organization:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'An organization with this name already exists',
        code: 'DUPLICATE_ORGANIZATION'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating organization',
      code: 'SERVER_ERROR',
      error: err.message 
    });
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

/**
 * Update co-admin emails for an organization
 * @route PUT /api/organizations/:orgId/coadmin-emails
 * @access Private (Admin only)
 */
exports.updateCoAdminEmails = async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user._id;
    
    // Find the organization
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Check if user is the admin of this organization
    if (org.adminId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update co-admin emails for this organization',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Update co-admin emails with validated data from middleware
    org.coAdminEmails = (req.validatedEmails || []).map(email => ({
      email: email.email, // Preserve original email
      normalizedEmail: email.normalizedEmail || email.email.toLowerCase(),
      verificationToken: email.verificationToken || uuidv4(),
      isVerified: email.isVerified || false,
      addedAt: email.addedAt || new Date()
    }));
    
    org.updatedAt = new Date();
    
    await org.save();
    
    // Prepare response data without sensitive information
    const responseData = {
      id: org._id,
      name: org.name,
      coAdminCount: org.coAdminEmails.length,
      updatedAt: org.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: 'Co-admin emails updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error updating co-admin emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update co-admin emails',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get co-admin emails for an organization
 * @route GET /api/organizations/:orgId/coadmin-emails
 * @access Private (Admin and Co-admins)
 */
exports.getCoAdminEmails = async (req, res) => {
  try {
    const { orgId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email.toLowerCase();
    
    // Find the organization
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }
    
    // Check if user is the admin or a co-admin of this organization
    const isAdmin = org.adminId.toString() === userId.toString();
    const isCoAdmin = org.coAdminEmails.some(
      emailObj => emailObj.normalizedEmail === userEmail
    );
    
    if (!isAdmin && !isCoAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view co-admin emails for this organization',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }
    
    // Return co-admin emails (sensitive fields like verificationToken are not included)
    const coAdminEmails = org.coAdminEmails.map(email => ({
      email: email.email,
      isVerified: email.isVerified,
      addedAt: email.addedAt
    }));
    
    res.status(200).json({
      success: true,
      data: {
        coAdminEmails,
        isAdmin // Include role information in the response
      }
    });
  } catch (error) {
    console.error('Error fetching co-admin emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch co-admin emails',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get organizations where the current user is a co-admin
 * @route GET /api/organizations/coadmin
 * @access Private
 */
exports.getOrgsByCoAdmin = async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    
    // Find all organizations where the user is a co-admin
    const orgs = await Organization.find({
      coAdminEmails: { $elemMatch: { email: userEmail } }
    }).select('name adminEmail createdAt');
    
    res.status(200).json({
      success: true,
      count: orgs.length,
      data: orgs
    });
  } catch (error) {
    console.error('Error fetching co-admin organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch co-admin organizations',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};