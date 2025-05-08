// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmployee,
  checkVerificationStatus,
  handleSupabaseWebhook
} = require('../controllers/authController');

// Direct registration (after Supabase signup)
router.post('/register', registerUser);

// (Optional) disable webhook or leave as no-op
router.post('/supabase/webhook', handleSupabaseWebhook);

// Employee verification
router.post('/verify', verifyEmployee);

// Check status + role
router.get('/verify-status', checkVerificationStatus);

module.exports = router;
