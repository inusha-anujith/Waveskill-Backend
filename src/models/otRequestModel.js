const mongoose = require('mongoose');

const otRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    otHours: {
        type: Number,
        required: true,
        min: 0.5,
        max: 12
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewNote: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('OTRequest', otRequestSchema);
