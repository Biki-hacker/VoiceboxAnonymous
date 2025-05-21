// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmployee,
  checkVerificationStatus 
} = require('../controllers/authController');

// Direct registration (after Supabase signup)
router.post('/register', registerUser);

// Employee verification
router.post('/verify', verifyEmployee);

// Check status + role
router.get('/verify-status', checkVerificationStatus);

module.exports = router;