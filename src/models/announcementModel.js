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
    // 'system' = created by Admin (company-wide); 'project' = created by Manager (team-level)
    type: {
        type: String,
        enum: ['system', 'project'],
        default: 'system'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true }); // Automatically gives us the date it was posted!

module.exports = mongoose.model('Announcement', announcementSchema);