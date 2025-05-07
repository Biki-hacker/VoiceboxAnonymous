// models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  verificationSchema: {
    type: [String], // Fields used for employee verification (e.g., ["employeeId", "region", "department"])
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
