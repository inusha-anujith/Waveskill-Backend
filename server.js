require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const cron = require('node-cron'); 

const Attendance = require('./src/models/attendanceModel');
const User = require('./src/models/userModel'); 
const OTRequest = require('./src/models/otRequestModel');
const Holiday = require('./src/models/holidayModel'); // [NEW] Import Holiday model

// Connect Database
connectDB();
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Helper: Get accurate Sri Lanka date string
const getSLDateString = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"})).toISOString().split('T')[0];
};

// ==========================================
// 1. SMART AUTO-CHECKOUT (Runs daily at 22:00)
// ==========================================
cron.schedule('0 22 * * *', async () => {
    console.log('Running Smart Auto-Checkout Cron Job...');
    try {
        const todayStr = getSLDateString();
        const activeAttendances = await Attendance.find({ dateString: todayStr, checkOut: null });
        
        for (let record of activeAttendances) {
            // Check if this specific user has an APPROVED OT request for today
            const approvedOT = await OTRequest.findOne({ 
                user: record.user, 
                date: new Date(todayStr), 
                status: 'Approved' 
            });

            // Base maximum checkout time is strictly 17:30
            let maxAllowedTime = new Date(record.checkIn);
            maxAllowedTime.setHours(17, 30, 0, 0);

            // If OT is approved, extend the allowed checkout time by the requested hours
            if (approvedOT) {
                maxAllowedTime = new Date(maxAllowedTime.getTime() + (approvedOT.otHours * 60 * 60 * 1000));
            }

            // Since it is 22:00 (past all shifts), force the checkout to the maximum allowed time
            record.checkOut = maxAllowedTime;

            // Calculate standard work hours (capped at 17:30)
            const standardEnd = new Date(record.checkIn);
            standardEnd.setHours(17, 30, 0, 0);
            const diffInMins = Math.floor((standardEnd - new Date(record.checkIn)) / (1000 * 60));
            record.workHours = `${Math.floor(diffInMins / 60)}h ${diffInMins % 60}m`;

            // Calculate OT Hours if applicable
            if (approvedOT) {
                const otDiffMins = Math.floor((maxAllowedTime - standardEnd) / (1000 * 60));
                record.otHours = `${Math.floor(otDiffMins / 60)}h ${otDiffMins % 60}m`;
            } else {
                record.otHours = '0h 0m';
            }
            
            await record.save();
        }
    } catch (err) { console.error('Error in Auto-Checkout cron', err); }
}, { scheduled: true, timezone: "Asia/Colombo" });

// ==========================================
// 2. HOLIDAY-AWARE AUTO-ABSENT (Runs daily at 23:59)
// ==========================================
cron.schedule('59 23 * * *', async () => {
    console.log('Running Holiday-Aware Auto-Absent Job...');
    try {
        const todayStr = getSLDateString();
        const slDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
        
        // Check 1: Is it a Weekend in Sri Lanka? (0 = Sunday, 6 = Saturday)
        const dayOfWeek = slDate.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        // Check 2: Is it a registered public holiday?
        const isHoliday = await Holiday.findOne({ dateString: todayStr });

        const users = await User.find({});
        
        for (let user of users) {
            const recordExists = await Attendance.findOne({ user: user._id, dateString: todayStr });
            
            // If they didn't check in today, determine WHY based on the calendar
            if (!recordExists) {
                let finalStatus = 'Absent';
                let reasonNote = '';

                if (isHoliday) {
                    finalStatus = 'Holiday';
                    reasonNote = isHoliday.name;
                } else if (isWeekend) {
                    finalStatus = 'Holiday';
                    reasonNote = 'Weekend';
                }

                await Attendance.create({
                    user: user._id,
                    dateString: todayStr,
                    status: finalStatus,
                    notes: reasonNote // Save the reason so the frontend can display it!
                });
            }
        }
    } catch (err) { console.error('Error in Auto-Absent cron', err); }
}, { scheduled: true, timezone: "Asia/Colombo" });

process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});