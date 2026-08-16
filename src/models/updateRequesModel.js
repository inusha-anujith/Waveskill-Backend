const mongoose = require('mongoose');

const updateRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  note: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'PENDING'
  }
}, { timestamps: true });

module.exports = mongoose.model('UpdateRequest', updateRequestSchema);