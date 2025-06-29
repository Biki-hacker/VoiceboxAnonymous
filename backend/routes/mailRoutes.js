// routes/mailRoutes.js
const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../controllers/mailController');
const rateLimit = require('express-rate-limit');

// Contact form rate limiting
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 contact form submissions per 15 minutes
  message: {
    error: 'Too many contact form submissions. Please try again after 15 minutes.',
  },
});

// @route   POST api/mail/contact
// @desc    Send contact form email
// @access  Public
router.post('/contact', contactLimiter, sendContactEmail);

module.exports = router;