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
    // This enum perfectly matches the badges and summary boxes in your UI
    priority: { 
        type: String, 
        enum: ['Urgent', 'Important', 'Normal'], 
        default: 'Normal' 
    },
    // This links to the Admin who created it so we can display "Posted by Admin User"
    postedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
}, { timestamps: true }); // Automatically gives us the date it was posted!

module.exports = mongoose.model('Announcement', announcementSchema);