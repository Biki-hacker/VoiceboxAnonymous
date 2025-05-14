// routes/mailRoutes.js
const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../controllers/mailController');

// @route   POST api/mail/contact
// @desc    Send contact form email
// @access  Public
router.post('/contact', sendContactEmail);

module.exports = router;