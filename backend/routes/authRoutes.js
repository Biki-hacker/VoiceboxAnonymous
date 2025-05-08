// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  verifyEmployee,
  checkVerificationStatus,
  handleSupabaseWebhook
} = require('../controllers/authController');

// Supabase Webhook for signup event
router.post('/supabase/webhook', handleSupabaseWebhook);

// Employee Verification Route
router.post('/verify', verifyEmployee);

// Check if already verified (called after sign-in)
router.get('/verify-status', checkVerificationStatus);

module.exports = router;
