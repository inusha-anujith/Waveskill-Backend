const cron = require('node-cron');
const Attendance = require('../models/attendanceModel');

// Runs at 23:55 every day.
// Finds any records checked in but not checked out and sets checkout to 18:00 of that day.
const startAutoCheckoutJob = () => {
    cron.schedule('55 23 * * *', async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];

            const unchecked = await Attendance.find({
                dateString: todayStr,
                checkIn: { $exists: true, $ne: null },
                checkOut: null
            });

            if (unchecked.length === 0) return;

            for (const record of unchecked) {
                const checkOut = new Date(record.checkIn);
                checkOut.setHours(18, 0, 0, 0);

                // Only set if checkout would be after checkin
                if (checkOut > record.checkIn) {
                    const diffMin = Math.floor((checkOut - record.checkIn) / 60000);
                    record.checkOut = checkOut;
                    record.workHours = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m (auto)`;
                    await record.save();
                }
            }

            console.log(`[AutoCheckout] Applied default checkout for ${unchecked.length} record(s) on ${todayStr}`);
        } catch (err) {
            console.error('[AutoCheckout] Job failed:', err.message);
        }
    }, { timezone: 'Asia/Colombo' });

    console.log('[AutoCheckout] Scheduled: daily at 23:55 (Asia/Colombo)');
};

module.exports = { startAutoCheckoutJob };
