// backend/routes/authRoutes.js
const express = require('express');
const {
  verifyEmployee,
  checkVerificationStatus
} = require('../controllers/authController');

const router = express.Router();

router.post('/verify', verifyEmployee);
router.get('/is-verified', checkVerificationStatus); // new route to check verification status
router.get('/verify-status', checkVerificationStatus);


module.exports = router;
