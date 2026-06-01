const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  // Company Information
  companyName: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  // System Tracking Status for UI requirements
  status: {
    type: String,
    default: "Active Client"
  },
  location: {
    type: String,
    default: "Colombo, Sri Lanka"
  }
}, {
  // Automatically creates createdAt and updatedAt fields
  timestamps: true 
});

module.exports = mongoose.model('Customer', customerSchema);