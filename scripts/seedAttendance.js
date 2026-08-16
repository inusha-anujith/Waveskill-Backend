require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const Attendance = require('../src/models/attendanceModel');

// Build a local date string N days ago (YYYY-MM-DD in local timezone)
const dateStr = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
};

// Build a Date for N days ago at the given HH:MM in local time
const buildTime = (daysAgo, hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d;
};

const calcWorkHours = (checkIn, checkOut) => {
    const diffMin = Math.floor((checkOut - checkIn) / 60000);
    return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
};

// Attendance plan: [email, daysAgo, checkIn, checkOut|null, status]
// status rules: arrive <= 09:00 → Present, arrive > 09:00 → Late, no arrive → Absent
const PLAN = [
    // Today
    { email: 'john@waveskill.com',  daysAgo: 0, checkIn: '08:45', checkOut: '17:30', status: 'Present' },
    { email: 'jane@waveskill.com',  daysAgo: 0, checkIn: '09:35', checkOut: null,    status: 'Late' },
    { email: 'mike@waveskill.com',  daysAgo: 0, checkIn: '08:55', checkOut: '18:00', status: 'Present' },
    // Yesterday
    { email: 'john@waveskill.com',  daysAgo: 1, checkIn: '08:50', checkOut: '17:45', status: 'Present' },
    { email: 'jane@waveskill.com',  daysAgo: 1, checkIn: '09:10', checkOut: '18:05', status: 'Late' },
    { email: 'mike@waveskill.com',  daysAgo: 1, checkIn: '08:40', checkOut: '17:20', status: 'Present' },
    { email: 'lisa@waveskill.com',  daysAgo: 1, checkIn: '09:00', checkOut: '17:30', status: 'Present' },
    // 2 days ago
    { email: 'john@waveskill.com',  daysAgo: 2, checkIn: '09:05', checkOut: '18:00', status: 'Late' },
    { email: 'jane@waveskill.com',  daysAgo: 2, checkIn: '08:55', checkOut: '17:55', status: 'Present' },
    { email: 'mike@waveskill.com',  daysAgo: 2, checkIn: null,    checkOut: null,    status: 'Absent' },
    { email: 'lisa@waveskill.com',  daysAgo: 2, checkIn: '08:30', checkOut: '17:30', status: 'Present' },
    // 3 days ago
    { email: 'john@waveskill.com',  daysAgo: 3, checkIn: '08:55', checkOut: '17:30', status: 'Present' },
    { email: 'jane@waveskill.com',  daysAgo: 3, checkIn: null,    checkOut: null,    status: 'Absent' },
    { email: 'mike@waveskill.com',  daysAgo: 3, checkIn: '09:15', checkOut: '18:10', status: 'Late' },
    { email: 'lisa@waveskill.com',  daysAgo: 3, checkIn: '08:45', checkOut: '17:45', status: 'Present' },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let created = 0;
        let skipped = 0;

        for (const p of PLAN) {
            const user = await User.findOne({ email: p.email });
            if (!user) { skipped++; continue; }

            const ymd = dateStr(p.daysAgo);
            const exists = await Attendance.findOne({ user: user._id, dateString: ymd });
            if (exists) { skipped++; continue; }

            let checkIn = null;
            let checkOut = null;
            let workHours = null;

            if (p.checkIn) {
                checkIn = buildTime(p.daysAgo, p.checkIn);
            }
            if (p.checkOut && checkIn) {
                checkOut = buildTime(p.daysAgo, p.checkOut);
                workHours = calcWorkHours(checkIn, checkOut);
            }

            await Attendance.create({
                user: user._id,
                dateString: ymd,
                checkIn,
                checkOut,
                status: p.status,
                workHours: workHours || '0h 0m'
            });
            created++;
        }

        console.log(`Attendance seeded: ${created} created, ${skipped} skipped`);
        process.exit(0);
    } catch (e) {
        console.error(`Seed attendance failed: ${e.message}`);
        process.exit(1);
    }
})();
