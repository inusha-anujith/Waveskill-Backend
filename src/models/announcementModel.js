const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    priority: {
        type: String,
        enum: ['Urgent', 'Important', 'Normal'],
        default: 'Normal'
    },
    type: {
        type: String,
        enum: ['system', 'project'],
        default: 'system'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // [NEW]: Array to track which users have read this announcement
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);