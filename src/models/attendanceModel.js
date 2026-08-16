const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    dateString: { 
        type: String, 
        required: true 
    },
    checkIn: { 
        type: Date 
    },
    checkOut: { 
        type: Date 
    },
    status: { 
        type: String, 
        enum: ['Present', 'Late', 'Absent'], 
        default: 'Present' 
    },
    workHours: {
        type: String,
        default: '0h 0m'
    },
    otHours: { // <-- NEW FIELD FOR OT
        type: String,
        default: '0h 0m'
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);