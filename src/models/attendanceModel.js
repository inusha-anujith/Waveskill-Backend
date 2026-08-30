const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateString: { type: String, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { 
        type: String, 
        // [UPDATE]: Added 'Holiday' to the allowed list of statuses
        enum: ['Present', 'Late', 'Absent', 'Holiday'], 
        default: 'Present' 
    },
    workHours: { type: String, default: '0h 0m' },
    otHours: { type: String, default: '0h 0m' },
    // [NEW]: Field to store the holiday name or automated system notes
    notes: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);