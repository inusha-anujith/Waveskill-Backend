const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    // Links the leave request to the specific employee who is logged in
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Updated VIP list to match your frontend perfectly!
    leaveType: { 
        type: String, 
        required: true,
        enum: ['Casual Leave', 'Sick Leave', 'Annual Leave'] 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    // We will calculate this automatically in the controller so your frontend doesn't have to!
    days: {
        type: Number,
        required: true
    },
    reason: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' // Every new request starts here
    }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);