// backend/routes/orgRoutes.js
const express = require('express');
const { getOrgByAdminId, updateVerificationParams } = require('../controllers/orgController');
const router = express.Router();

router.get('/admin/:adminId', getOrgByAdminId);
router.put('/admin/:adminId/params', updateVerificationParams);

module.exports = router;
