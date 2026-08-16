const cron = require('node-cron');
const Attendance = require('../models/attendanceModel');

// Helper to get current time accurately in Sri Lanka (UTC+5:30)
const getSriLankaTime = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
};

// This cron expression '59 23 * * *' means: "Run at 23:59 (11:59 PM) every single day"
cron.schedule('59 23 * * *', async () => {
    console.log('⏳ Running Daily Auto-Checkout Job...');
    
    try {
        const localNow = getSriLankaTime();
        
        // Format today's date string (e.g., "2026-04-29")
        const year = localNow.getFullYear();
        const month = String(localNow.getMonth() + 1).padStart(2, '0');
        const day = String(localNow.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        // 1. Find everyone who checked in today but hasn't checked out
        const openAttendances = await Attendance.find({ 
            dateString: dateString,
            checkOut: null // Finds records where checkOut doesn't exist yet
        });

        if (openAttendances.length === 0) {
            console.log('✅ No pending checkouts found for today. Everyone checked out properly!');
            return;
        }

        // 2. Create the exact 6:00 PM auto-checkout time for today
        const autoCheckoutTime = new Date(localNow);
        autoCheckoutTime.setHours(18, 0, 0, 0); // 18:00:00

        // 3. Loop through the rule-breakers and fix their records
        for (let record of openAttendances) {
            const checkInTime = new Date(record.checkIn);
            
            // Edge Case: If they somehow checked in AFTER 6 PM, just set checkout to 1 hour later 
            // so we don't get negative work hours!
            let finalCheckout = autoCheckoutTime;
            if (checkInTime > autoCheckoutTime) {
                finalCheckout = new Date(checkInTime.getTime() + (60 * 60 * 1000)); 
            }

            // Calculate the math
            const diffInMilliseconds = finalCheckout - checkInTime;
            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
            const hours = Math.floor(diffInMinutes / 60);
            const minutes = diffInMinutes % 60;

            // Save the automated data
            record.checkOut = finalCheckout;
            record.workHours = `${hours}h ${minutes}m`;
            
            // Optional but highly recommended: You can add a note or status 
            // so the Admin knows the system did this automatically
            record.status = "Incomplete (Auto-Closed)"; 

            await record.save();
        }

        console.log(`✅ Successfully auto-checked out ${openAttendances.length} employees at 6:00 PM.`);
    } catch (error) {
        console.error('❌ Error in Auto-Checkout Job:', error.message);
    }
});

module.exports = cron;