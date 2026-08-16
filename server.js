require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startAutoCheckoutJob } = require('./src/jobs/autoCheckout');

// --- THE MISSING IMPORTS ---
const cron = require('node-cron'); 
const Attendance = require('./src/models/attendanceModel');
const User = require('./src/models/userModel'); // (Make sure this path matches your user model file)

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startAutoCheckoutJob();
});

// --- AUTOMATED CRON JOBS ---

// 1. Auto-Checkout at 22:00 (10:00 PM) everyday
cron.schedule('0 22 * * *', async () => {
    console.log('Running Auto-Checkout Cron Job...');
    try {
        const todayStr = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"})).toISOString().split('T')[0];
        const activeAttendances = await Attendance.find({ dateString: todayStr, checkOut: null });
        
        const autoCheckOutTime = new Date();
        
        for (let record of activeAttendances) {
            const checkInTime = new Date(record.checkIn);
            
            const diffInMinutes = Math.floor((autoCheckOutTime - checkInTime) / (1000 * 60));
            const hours = Math.floor(diffInMinutes / 60);
            const minutes = diffInMinutes % 60;
            record.workHours = `${hours}h ${minutes}m`;

            const otThreshold = new Date(autoCheckOutTime);
            otThreshold.setHours(17, 30, 0, 0);
            
            const otStart = checkInTime > otThreshold ? checkInTime : otThreshold;
            const otDiffMins = Math.floor((autoCheckOutTime - otStart) / (1000 * 60));
            const otHours = Math.floor(otDiffMins / 60);
            const otMins = otDiffMins % 60;
            
            record.otHours = `${otHours}h ${otMins}m`;
            record.checkOut = autoCheckOutTime;
            
            await record.save();
        }
    } catch (err) {
        console.error('Error in Auto-Checkout cron', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Colombo"
});

// 2. Auto-Absent at 23:59 (11:59 PM) everyday
cron.schedule('59 23 * * *', async () => {
    console.log('Running Auto-Absent Cron Job...');
    try {
        const todayStr = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"})).toISOString().split('T')[0];
        const users = await User.find({});
        
        for (let user of users) {
            const recordExists = await Attendance.findOne({ user: user._id, dateString: todayStr });
            if (!recordExists) {
                await Attendance.create({
                    user: user._id,
                    dateString: todayStr,
                    status: 'Absent'
                });
            }
        }
    } catch (err) {
        console.error('Error in Auto-Absent cron', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Colombo"
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});