require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const Attendance = require('../src/models/attendanceModel');

const todayStr = new Date().toISOString().split('T')[0];

const timeToday = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
};

// Some present, some late, two left absent (Lisa Chen, Sarah Manager)
const PLAN = [
    { email: 'john@waveskill.com', checkIn: '08:45', checkOut: '17:30', status: 'Present' },
    { email: 'jane@waveskill.com', checkIn: '09:35', checkOut: null, status: 'Late' },
    { email: 'mike@waveskill.com', checkIn: '08:55', checkOut: null, status: 'Present' },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let created = 0;
        let skipped = 0;
        for (const p of PLAN) {
            const user = await User.findOne({ email: p.email });
            if (!user) {
                skipped++;
                continue;
            }
            const exists = await Attendance.findOne({ user: user._id, dateString: todayStr });
            if (exists) {
                skipped++;
                continue;
            }
            const checkIn = timeToday(p.checkIn);
            let workHours = '0h 0m';
            let checkOut = null;
            if (p.checkOut) {
                checkOut = timeToday(p.checkOut);
                const diffMin = Math.floor((checkOut - checkIn) / 60000);
                workHours = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
            }
            await Attendance.create({
                user: user._id,
                dateString: todayStr,
                checkIn,
                checkOut,
                status: p.status,
                workHours,
            });
            created++;
        }
        console.log(`Attendance for ${todayStr} seeded: ${created} created, ${skipped} skipped`);
        process.exit(0);
    } catch (e) {
        console.error(`Seed attendance failed: ${e.message}`);
        process.exit(1);
    }
})();
