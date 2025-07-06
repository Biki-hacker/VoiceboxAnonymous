const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common function to validate email array
const validateEmailArray = (emails, maxEmails, type = 'employee') => {
  if (!emails || !Array.isArray(emails)) {
    return {
      valid: false,
      error: {
        success: false,
        message: `Emails must be provided as an array`,
        code: 'INVALID_INPUT'
      }
    };
  }

  if (emails.length > maxEmails) {
    return {
      valid: false,
      error: {
        success: false,
        message: `Maximum ${maxEmails} ${type} emails allowed per organization`,
        code: 'EMAIL_LIMIT_EXCEEDED'
      }
    };
  }

  // Validate and deduplicate emails
  const validatedEmails = [];
  const seenEmails = new Set();
  const invalidEmails = [];
  
  for (const email of emails) {
    try {
      console.log(`Processing ${type} email input:`, { raw: email, type: typeof email });
      
      // Ensure we have a string and trim whitespace
      const emailStr = String(email).trim();
      
      // Validate the email format (case-insensitive check)
      if (!EMAIL_REGEX.test(emailStr)) {
        console.log('Invalid email format:', emailStr);
        invalidEmails.push(emailStr);
        continue;
      }
      
      // Normalize for duplicate checking (case-insensitive)
      const normalized = emailStr.toLowerCase();
      
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
        validatedEmails.push(emailEntry);
      } else {
        console.log(`Skipping duplicate ${type} email (case-insensitive):`, emailStr);
      }
    } catch (error) {
      console.error(`Error processing ${type} email:`, email, error);
      invalidEmails.push(String(email));
    }
  }
  
  if (invalidEmails.length > 0) {
    return {
      valid: false,
      error: {
        success: false,
        message: 'One or more email addresses are invalid',
        code: 'INVALID_EMAILS',
        invalidEmails
      }
    };
  }
  
  return { valid: true, validatedEmails };
};

/**
 * Middleware to validate co-admin emails
 */
const validateCoAdminEmails = (req, res, next) => {
  const { emails } = req.body;
  
  // Validate email array with max 5 co-admin emails
  const result = validateEmailArray(emails, 5, 'co-admin');
  
  if (!result.valid) {
    return res.status(400).json(result.error);
  }
  
  // Attach the processed emails to the request for use in the route handler
  req.validatedEmails = result.validatedEmails;
  next();
};

/**
 * Middleware to validate employee emails
 */
const validateEmployeeEmails = (req, res, next) => {
  const { emails } = req.body;
  
  // Validate email array with max 25 employee emails
  const result = validateEmailArray(emails, 25, 'employee');
  
  if (!result.valid) {
    return res.status(400).json(result.error);
  }
  
  // Attach the processed emails to the request for use in the route handler
  req.validatedEmails = result.validatedEmails;
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
  validateCoAdminEmails,
  validateOrgId,
  validateEmailParam,
  handleValidationErrors,
  EMAIL_REGEX
};
