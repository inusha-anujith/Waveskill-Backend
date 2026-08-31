require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const OTRequest = require('../src/models/otRequestModel');

// Build a Date for N days ago at midnight local time, matching how the OT
// model stores request dates.
const daysAgoDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(0, 0, 0, 0);
    return d;
};

// A spread of Pending / Approved / Rejected so the Manager OT tab shows the
// status filter working and still has rows with live Approve/Reject buttons.
const PLAN = [
    // Pending — these are the ones a manager can act on
    { email: 'john@waveskill.com', daysAgo: 1, otHours: 3,   reason: 'Production hotfix for the payment gateway release', status: 'Pending' },
    { email: 'jane@waveskill.com', daysAgo: 2, otHours: 2.5, reason: 'Campaign launch assets needed before client review', status: 'Pending' },
    { email: 'mike@waveskill.com', daysAgo: 2, otHours: 4,   reason: 'Regression testing ahead of the v2.3 release', status: 'Pending' },
    { email: 'lisa@waveskill.com', daysAgo: 3, otHours: 1.5, reason: 'Onboarding paperwork for three new joiners', status: 'Pending' },
    { email: 'john@waveskill.com', daysAgo: 4, otHours: 5,   reason: 'Database migration window ran past scheduled hours', status: 'Pending' },

    // Already reviewed — gives the Approved/Rejected filters something to show
    { email: 'mike@waveskill.com', daysAgo: 8,  otHours: 3,   reason: 'Load testing the reporting service', status: 'Approved', reviewNote: 'Approved — critical for the release sign-off.' },
    { email: 'jane@waveskill.com', daysAgo: 9,  otHours: 2,   reason: 'Trade show booth material preparation', status: 'Approved', reviewNote: 'Approved.' },
    { email: 'john@waveskill.com', daysAgo: 11, otHours: 6,   reason: 'Refactoring the notification module', status: 'Rejected', reviewNote: 'Not urgent — please schedule within normal hours.' },
    { email: 'lisa@waveskill.com', daysAgo: 12, otHours: 2,   reason: 'Updating the employee handbook', status: 'Rejected', reviewNote: 'Can be absorbed into next sprint.' },
    { email: 'mike@waveskill.com', daysAgo: 14, otHours: 3.5, reason: 'Emergency bug triage after the outage', status: 'Approved', reviewNote: 'Approved — incident response.' },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Reviewed rows are attributed to the seeded manager, if present.
        const manager = await User.findOne({ email: 'manager@waveskill.com' });
        if (!manager) {
            console.warn('Manager account not found — run "npm run seed:users" first. Reviewed rows will have no reviewer.');
        }

        let created = 0;
        let skipped = 0;
        let missingUser = 0;

        for (const p of PLAN) {
            const user = await User.findOne({ email: p.email });
            if (!user) { missingUser++; continue; }

            const date = daysAgoDate(p.daysAgo);

            // Idempotent: one request per user per date, same as seedAttendance.
            const exists = await OTRequest.findOne({ user: user._id, date });
            if (exists) { skipped++; continue; }

            await OTRequest.create({
                user: user._id,
                date,
                otHours: p.otHours,
                reason: p.reason,
                status: p.status,
                ...(p.status !== 'Pending' && {
                    reviewedBy: manager ? manager._id : undefined,
                    reviewNote: p.reviewNote || ''
                })
            });
            created++;
        }

        const pending = PLAN.filter(p => p.status === 'Pending').length;
        console.log(`OT requests seeded: ${created} created, ${skipped} already existed${missingUser ? `, ${missingUser} skipped (user not found)` : ''}`);
        console.log(`${pending} of them are Pending and can be approved/rejected from the Manager > Attendance > OT Requests tab.`);
        process.exit(0);
    } catch (e) {
        console.error(`Seed OT requests failed: ${e.message}`);
        process.exit(1);
    }
})();
