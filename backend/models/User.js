// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    trim: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: { 
    type: String, 
    required: [
      function() { return this.role === 'admin' || !this.isNew; }, 
      'Password is required for admin users'
    ],
    select: false 
  }, 
  role: { 
    type: String, 
    enum: {
      values: ['admin', 'employee'],
      message: 'Role must be either admin or employee'
    },
    required: [true, 'Role is required']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  // For backward compatibility
  verificationParams: { 
    type: Object, 
    default: {},
    select: false // Hide from API responses
  },
  verified: { 
    type: Boolean, 
    default: false,
    index: true // For faster queries on verified status
  },
  lastLogin: { 
    type: Date,
    default: null
  },
  lastPasswordChange: { 
    type: Date, 
    select: false 
  }, 
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive information when converting to JSON
      delete ret.password;
      delete ret.verificationParams;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.verificationParams;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hooks
userSchema.pre('save', async function(next) {
  // Update timestamps
  this.updatedAt = new Date();
  
  // Only process password if it's being modified (or is new)
  if (this.isModified('password') && this.password) {
    try {
      // Generate a salt
      const salt = await bcrypt.genSalt(10);
      // Hash the password with the salt
      this.password = await bcrypt.hash(this.password, salt);
      // Record the time of password change
      this.lastPasswordChange = new Date();
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Instance methods
userSchema.methods = {
  // Compare candidate password with the stored hashed password
  comparePassword: async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  },
  
  // Mark user as verified
  markAsVerified: function() {
    this.verified = true;
    return this.save();
  },
  
  // Update last login timestamp
  updateLastLogin: function() {
    this.lastLogin = new Date();
    return this.save();
  }
};

// Static methods
userSchema.statics = {
  // Find or create a user by email
  findOrCreate: async function({ email, role = 'employee', organizationId = null }) {
    let user = await this.findOne({ email });
    
    if (!user) {
      user = new this({
        email,
        role,
        organizationId,
        verified: organizationId ? false : true // Auto-verify if no org
      });
      await user.save();
    }
    
    return user;
  }
};

// Index for better query performance on organizationId and verified fields
userSchema.index({ organizationId: 1, verified: 1 });

module.exports = mongoose.model('User', userSchema);
