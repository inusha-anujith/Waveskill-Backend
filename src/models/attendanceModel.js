const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    // Links this attendance record to the specific employee who logged in
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // We store the date as a simple string (e.g., "YYYY-MM-DD") to easily check if they already checked in today
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
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);