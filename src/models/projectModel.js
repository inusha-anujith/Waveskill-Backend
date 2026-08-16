const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    
    enum: ['ONGOING', 'COMPLETED', 'REJECTED', 'PENDING', 'IN_REVIEW'], 
    default: 'ONGOING' 
  },
  progress: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  deadline: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);