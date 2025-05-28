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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
organizationSchema.index({ 'employeeEmails.email': 1 });
organizationSchema.index({ 'employeeEmails.normalizedEmail': 1 });

// Ensure normalizedEmail is always set and in sync with email
organizationSchema.pre('save', function(next) {
  if (this.isModified('employeeEmails')) {
    console.log('Before processing employeeEmails:', JSON.stringify(this.employeeEmails, null, 2));
    
    this.employeeEmails = this.employeeEmails.map((email, index) => {
      try {
        console.log(`Processing email at index ${index}:`, JSON.stringify(email, null, 2));
        
        // Create a new object to ensure setters are called
        const updated = { ...email.toObject() };
        
        // Log the email before any processing
        console.log(`Before processing - email: '${updated.email}', normalized: '${updated.normalizedEmail}'`);
        
        // Preserve the original email exactly as is
        const originalEmail = updated.email;
        
        // Only update normalizedEmail, leave email as is
        updated.normalizedEmail = originalEmail ? originalEmail.toLowerCase() : '';
        
        console.log(`After processing - email: '${updated.email}', normalized: '${updated.normalizedEmail}'`);
        
        return updated;
      } catch (error) {
        console.error('Error processing email:', error);
        return email; // Return as-is if there's an error
      }
    });
    
    console.log('After processing employeeEmails:', JSON.stringify(this.employeeEmails, null, 2));
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;