// backend/routes/orgRoutes.js
const express = require('express');
const { check } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const orgController = require('../controllers/orgController');
const { validateEmployeeEmails, validateCoAdminEmails } = require('../middleware/validation');

// Import validation middleware
const { body, param } = require('express-validator');

// Email validation rules
const emailValidation = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Organization ID validation
const orgIdValidation = [
  param('orgId')
    .isMongoId()
    .withMessage('Invalid organization ID')
];

// Employee emails validation
const employeeEmailsValidation = [
  body('emails')
    .isArray({ max: 25 })
    .withMessage('Emails must be an array with a maximum of 25 items'),
  body('emails.*')
    .isEmail()
    .withMessage('Each email must be a valid email address')
];

// Co-admin emails validation
const coAdminEmailsValidation = [
  body('emails')
    .isArray({ max: 5 })
    .withMessage('Co-admin emails must be an array with a maximum of 5 items'),
  body('emails.*')
    .isEmail()
    .withMessage('Each email must be a valid email address')
];

const router = express.Router();

// Public routes
router.get('/search', orgController.searchOrganization);

// Email verification check (public endpoint)
router.get(
  '/:orgId/verify-email',
  [
    check('email').isEmail(),
    param('orgId').isMongoId()
  ],
  orgController.checkEmailVerification
);

// Protected routes (require authentication)
router.use(authMiddleware);

// Co-admin management routes (specific routes before parameterized routes)
router.get('/coadmin', orgController.getOrgsByCoAdmin);

// Organization CRUD routes
router.get('/by-admin', orgController.getOrgByAdminId);
router.post('/', orgController.createOrganization);

// Organization-specific routes with ID validation
router.route('/:orgId')
  .all(orgIdValidation)
  .get(orgController.getOrganizationById)
  .patch(orgController.updateOrganization)
  .delete(orgController.deleteOrganization);

// Employee email management routes (admin only)
router.route('/:orgId/emails')
  .all(orgIdValidation, authMiddleware)
  .get(orgController.getEmployeeEmails)
  .put(
    [...employeeEmailsValidation, validateEmployeeEmails],
    orgController.updateEmployeeEmails
  );

// Admin and co-admin routes (specific routes first)
router.get('/admin/:adminEmail', [
  param('adminEmail').isEmail().withMessage('Invalid email format')
], orgController.getOrgByAdminId);

router.route('/:orgId/coadmin-emails')
  .all(orgIdValidation)
  .get(orgController.getCoAdminEmails)
  .put(
    [...coAdminEmailsValidation, validateCoAdminEmails],
    orgController.updateCoAdminEmails
  );

// Legacy routes (for backward compatibility)
router.put(
  '/:orgId/verification-params',
  orgIdValidation,
  orgController.updateVerificationParams
);

module.exports = router;