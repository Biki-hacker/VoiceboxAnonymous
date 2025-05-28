const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware to validate employee emails
 */
const validateEmployeeEmails = (req, res, next) => {
  const { emails } = req.body;
  
  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ 
      success: false,
      message: 'Emails must be provided as an array',
      code: 'INVALID_INPUT'
    });
  }

  if (emails.length > 25) {
    return res.status(400).json({ 
      success: false,
      message: 'Maximum 25 employee emails allowed per organization',
      code: 'EMAIL_LIMIT_EXCEEDED'
    });
  }

  // Validate and deduplicate emails
  const validatedEmails = [];
  const seenEmails = new Set();
  const invalidEmails = [];
  
  for (const email of emails) {
    try {
      console.log('Processing email input:', { raw: email, type: typeof email });
      
      // Ensure we have a string and trim whitespace
      const emailStr = String(email).trim();
      console.log('After string conversion and trim:', emailStr);
      
      // Validate the email format (case-insensitive check)
      if (!EMAIL_REGEX.test(emailStr)) {
        console.log('Invalid email format:', emailStr);
        invalidEmails.push(emailStr);
        continue;
      }
      
      // Normalize for duplicate checking (case-insensitive)
      const normalized = emailStr.toLowerCase();
      console.log('Normalized for comparison:', normalized);
      
      // Check for duplicates case-insensitively but preserve original format
      if (!seenEmails.has(normalized)) {
        seenEmails.add(normalized);
        const emailEntry = {
          email: emailStr, // Keep the original email exactly as entered
          normalizedEmail: normalized, // Store lowercase version for case-insensitive lookups
          verificationToken: uuidv4(),
          isVerified: false,
          addedAt: new Date()
        };
        console.log('Adding email entry:', JSON.stringify(emailEntry, null, 2));
        validatedEmails.push(emailEntry);
      } else {
        console.log('Skipping duplicate email (case-insensitive):', emailStr);
      }
    } catch (error) {
      console.error('Error processing email:', email, error);
      invalidEmails.push(String(email));
    }
  }
  
  if (invalidEmails.length > 0) {
    return res.status(400).json({ 
      success: false,
      message: 'One or more email addresses are invalid',
      code: 'INVALID_EMAILS',
      invalidEmails
    });
  }
  
  // Attach the processed emails to the request for use in the route handler
  req.validatedEmails = validatedEmails;
  next();
};

/**
 * Middleware to validate organization ID
 */
const validateOrgId = (req, res, next) => {
  const { orgId } = req.params;
  
  if (!orgId || !orgId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid organization ID format',
      code: 'INVALID_ORG_ID'
    });
  }
  
  next();
};

/**
 * Middleware to validate email parameter
 */
const validateEmailParam = (req, res, next) => {
  const { email } = req.params;
  
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required',
      code: 'INVALID_EMAIL'
    });
  }
  
  // Normalize email
  req.params.email = email.trim().toLowerCase();
  next();
};

/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateEmployeeEmails,
  validateOrgId,
  validateEmailParam,
  handleValidationErrors,
  EMAIL_REGEX
};
