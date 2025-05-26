// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:   { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false }, 
  role:    { type: String, enum: ['admin','employee'], required: true },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  verificationParams: { type: Object, default: {} },
  verified:           { type: Boolean, default: false },
  lastPasswordChange: { type: Date, select: false }, 
  createdAt:          { type: Date, default: Date.now }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    // Record the time of password change if it's not the initial save
    if (!this.isNew) {
      this.lastPasswordChange = new Date();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare candidate password with the stored hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
