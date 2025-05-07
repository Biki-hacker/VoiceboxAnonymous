// backend/routes/orgRoutes.js
const express = require('express');
const {
  getOrgByAdminId,
  updateVerificationParams
} = require('../controllers/orgController');

const router = express.Router();

router.get('/admin/:adminEmail', getOrgByAdminId);
router.put('/admin/:adminEmail/params', updateVerificationParams);

module.exports = router;
