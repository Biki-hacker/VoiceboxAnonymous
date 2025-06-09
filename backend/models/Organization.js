// models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    unique: true,
    trim: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin user ID is required'],
    index: true
  },
  adminEmail: {
    type: String,
    required: [true, 'Admin email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  // Legacy fields for backward compatibility
  verificationSchema: {
    type: [String],
    default: [],
    select: false // Hide these fields by default
  },
  verificationFields: {
    type: [String],
    default: [],
    select: false // Hide these fields by default
  },
  // New field to store employee emails for verification
  employeeEmails: {
    type: [{
      email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\S+@\S+\.\S+$/i, 'Please use a valid email address'],
        get: function(email) {
          return email; // Return exactly as stored
        },
        set: function(email) {
          // Only trim whitespace, preserve all other characters including dots
          if (email && typeof email === 'string') {
            return email.trim();
          }
          return email;
        }
      },
      normalizedEmail: {
        type: String,
        required: true,
        select: false,
        set: function(email) {
          // Only normalize for comparison, keep original in 'email' field
          return email ? email.toLowerCase() : '';
        }
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationToken: {
        type: String,
        select: false
      }
    }],
    default: [],
    validate: [
      {
        validator: function(emails) {
          return emails.length <= 25;
        },
        message: 'Maximum 25 employee emails allowed per organization'
      },
      {
        validator: function(emails) {
          // Ensure no duplicate emails (case-insensitive)
          const normalizedEmails = emails.map(e => e.normalizedEmail);
          return new Set(normalizedEmails).size === normalizedEmails.length;
        },
        message: 'Duplicate email addresses are not allowed'
      }
    ]
  },
  // Co-admin emails with the same structure as employeeEmails but max 5
  coAdminEmails: {
    type: [{
      email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\S+@\S+\.\S+$/i, 'Please use a valid email address'],
        get: function(email) {
          return email; // Return exactly as stored
        },
        set: function(email) {
          if (email && typeof email === 'string') {
            return email.trim();
          }
          return email;
        }
      },
      normalizedEmail: {
        type: String,
        required: true,
        select: false,
        set: function(email) {
          return email ? email.toLowerCase() : '';
        }
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationToken: {
        type: String,
        select: false
      }
    }],
    default: [],
    validate: [
      {
        validator: function(emails) {
          return emails.length <= 5; // Max 5 co-admin emails
        },
        message: 'Maximum 5 co-admin emails allowed per organization'
      },
      {
        validator: function(emails) {
          const normalizedEmails = emails.map(e => e.normalizedEmail);
          return new Set(normalizedEmails).size === normalizedEmails.length;
        },
        message: 'Duplicate email addresses are not allowed'
      }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
organizationSchema.index({ 'employeeEmails.email': 1 });
organizationSchema.index({ 'employeeEmails.normalizedEmail': 1 });

// Function to process email arrays
const processEmailArray = (emailArray) => {
  if (!emailArray) return [];
  
  return emailArray.map((email) => {
    try {
      // Create a new object to ensure setters are called
      const updated = { ...email.toObject() };
      
      // Preserve the original email exactly as is
      const originalEmail = updated.email;
      
      // Only update normalizedEmail, leave email as is
      updated.normalizedEmail = originalEmail ? originalEmail.toLowerCase() : '';
      
      return updated;
    } catch (error) {
      console.error('Error processing email:', error);
      return email; // Return as-is if there's an error
    }
  });
};

// Ensure normalizedEmail is always set and in sync with email for both employeeEmails and coAdminEmails
organizationSchema.pre('save', function(next) {
  // Process employee emails if modified
  if (this.isModified('employeeEmails')) {
    this.employeeEmails = processEmailArray(this.employeeEmails);
  }
  
  // Process co-admin emails if modified
  if (this.isModified('coAdminEmails')) {
    this.coAdminEmails = processEmailArray(this.coAdminEmails);
  }
  
  next();
});

// Add indexes for coAdminEmails for better query performance
organizationSchema.index({ 'coAdminEmails.email': 1 });
organizationSchema.index({ 'coAdminEmails.normalizedEmail': 1 });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;