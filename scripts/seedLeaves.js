require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const Leave = require('../src/models/leaveModel');

const dayOffset = (offset) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
};

const PLAN = [
    // Pending
    {
        email: 'john@waveskill.com',
        leaveType: 'Sick Leave',
        start: dayOffset(2),
        end: dayOffset(3),
        reason: 'Flu symptoms, doctor advised 2 days of rest.',
        status: 'Pending',
    },
    {
        email: 'jane@waveskill.com',
        leaveType: 'Annual Leave',
        start: dayOffset(7),
        end: dayOffset(11),
        reason: 'Family vacation out of the city.',
        status: 'Pending',
    },
    {
        email: 'mike@waveskill.com',
        leaveType: 'Casual Leave',
        start: dayOffset(1),
        end: dayOffset(1),
        reason: 'Personal errand at the bank.',
        status: 'Pending',
    },
    {
        email: 'lisa@waveskill.com',
        leaveType: 'Sick Leave',
        start: dayOffset(4),
        end: dayOffset(4),
        reason: 'Scheduled medical appointment.',
        status: 'Pending',
    },
    // Approved (historical)
    {
        email: 'lisa@waveskill.com',
        leaveType: 'Annual Leave',
        start: dayOffset(-15),
        end: dayOffset(-11),
        reason: "Cousin's wedding.",
        status: 'Approved',
    },
    {
        email: 'john@waveskill.com',
        leaveType: 'Sick Leave',
        start: dayOffset(-5),
        end: dayOffset(-5),
        reason: 'Migraine.',
        status: 'Approved',
    },
    // Rejected
    {
        email: 'mike@waveskill.com',
        leaveType: 'Casual Leave',
        start: dayOffset(-20),
        end: dayOffset(-18),
        reason: 'Family event.',
        status: 'Rejected',
    },
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
            const exists = await Leave.findOne({
                user: user._id,
                startDate: p.start,
                leaveType: p.leaveType,
            });
            if (exists) {
                skipped++;
                continue;
            }
            const days = Math.round((p.end - p.start) / (1000 * 60 * 60 * 24)) + 1;
            await Leave.create({
                user: user._id,
                leaveType: p.leaveType,
                startDate: p.start,
                endDate: p.end,
                days,
                reason: p.reason,
                status: p.status,
            });
            created++;
        }
        console.log(`Leaves seeded: ${created} created, ${skipped} skipped (missing user or duplicate)`);
        process.exit(0);
    } catch (e) {
        console.error(`Seed leaves failed: ${e.message}`);
        process.exit(1);
    }
})();
