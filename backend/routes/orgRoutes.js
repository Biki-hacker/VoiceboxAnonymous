// backend/routes/orgRoutes.js
const express = require('express');
const {
  getOrgByAdminId,
  updateVerificationParams,
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  updateOrganization,
  searchOrganization
} = require('../controllers/orgController');

const router = express.Router();

// Route to get organizations by admin email
router.get('/by-admin', getOrgByAdminId);

// Route to search organization by name or ID
router.get('/search', searchOrganization);

// Route to update verification parameters
router.patch('/:orgId', updateOrganization);

// Route to create new organization
router.post('/', createOrganization);

// Route to delete an organization
router.delete('/:orgId', deleteOrganization);

// Route to get organization by ID
router.get('/:orgId', getOrganizationById);

// Legacy routes (for backward compatibility)
router.get('/admin/:adminEmail', getOrgByAdminId);
router.put('/admin/:adminEmail/params', updateVerificationParams);

module.exports = router;