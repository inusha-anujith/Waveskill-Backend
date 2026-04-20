const User = require('../../models/userModel');
const Leave = require('../../models/leaveModel');
const Attendance = require('../../models/attendanceModel');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Dashboard summary numbers
// @route   GET /api/admin/analytics/summary
const getSummary = async (req, res) => {
    try {
        const todayString = getTodayDateString();

        // Active employees = all non-Admin users (Admins manage the system, they aren't employees)
        const [activeEmployees, todayRecords, pendingLeaves] = await Promise.all([
            User.countDocuments({ role: { $in: ['Employee', 'Manager'] } }),
            Attendance.find({ dateString: todayString }).select('user status'),
            Leave.countDocuments({ status: 'Pending' })
        ]);

        const present = todayRecords.filter((r) => r.status === 'Present').length;
        const late = todayRecords.filter((r) => r.status === 'Late').length;
        const checkedIn = present + late;
        const absent = Math.max(0, activeEmployees - checkedIn);
        const rate = activeEmployees > 0
            ? Math.round((checkedIn / activeEmployees) * 1000) / 10 // one decimal, e.g. 87.5
            : 0;

        res.status(200).json({
            success: true,
            data: {
                activeEmployees,
                todayAttendance: {
                    present,
                    late,
                    absent,
                    checkedIn,
                    rate
                },
                pendingLeaves
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSummary };
