const express = require('express');
const { verifyEmployee } = require('../controllers/authController');
const router = express.Router();

router.post('/verify', verifyEmployee);

module.exports = router;
