// backend/routes/orgRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
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

// Public routes
router.get('/search', searchOrganization);

// Protected routes (require authentication)
router.use(authMiddleware);

// Route to get organizations by admin email
router.get('/by-admin', getOrgByAdminId);

// Legacy routes (for backward compatibility)
router.get('/admin/:adminEmail', getOrgByAdminId);
router.put('/admin/:adminEmail/params', updateVerificationParams);

// Organization CRUD routes
router.post('/', createOrganization);
router.get('/:orgId', getOrganizationById);
router.patch('/:orgId', updateOrganization);
router.delete('/:orgId', deleteOrganization);

module.exports = router;