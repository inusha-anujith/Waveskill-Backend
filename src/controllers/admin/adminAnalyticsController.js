const User = require('../../models/userModel');
const Leave = require('../../models/leaveModel');
const Attendance = require('../../models/attendanceModel');
const Announcement = require('../../models/announcementModel');
const Project = require('../../models/projectModel');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Deactivated staff are retained in the collection instead of being deleted, so
// every headcount here must exclude them — otherwise deactivating someone would
// leave the dashboard numbers unchanged. Documents predating the status field
// have no value, hence $ne rather than an equality match.
const ACTIVE_ONLY = { status: { $ne: 'Inactive' } };

// @desc    Role-scoped dashboard summary
// @route   GET /api/admin/analytics/summary
const getSummary = async (req, res) => {
    try {
        const role = req.user.role;
        const todayString = getTodayDateString();

        if (role === 'Admin') {
            // Admin scope: employee management + system announcements
            const [totalEmployees, totalManagers, systemAnnouncementCount, recentJoins] = await Promise.all([
                User.countDocuments({ role: 'Employee', ...ACTIVE_ONLY }),
                User.countDocuments({ role: 'Manager', ...ACTIVE_ONLY }),
                Announcement.countDocuments({ type: 'system' }),
                User.countDocuments({
                    role: { $in: ['Employee', 'Manager'] },
                    ...ACTIVE_ONLY,
                    joinDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                })
            ]);

            // Department breakdown
            const deptAgg = await User.aggregate([
                { $match: { role: { $in: ['Employee', 'Manager'] }, ...ACTIVE_ONLY } },
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            // CV status breakdown
            const cvAgg = await User.aggregate([
                { $match: { role: { $in: ['Employee', 'Manager'] }, ...ACTIVE_ONLY } },
                { $group: { _id: { $ifNull: ['$cvUpdateStatus', 'Needs Update'] }, count: { $sum: 1 } } }
            ]);

            return res.status(200).json({
                success: true,
                role: 'Admin',
                data: {
                    totalEmployees,
                    totalManagers,
                    totalStaff: totalEmployees + totalManagers,
                    recentJoins,
                    systemAnnouncementCount,
                    departmentBreakdown: deptAgg.map(d => ({ department: d._id || 'Unassigned', count: d.count })),
                    cvStatusBreakdown: cvAgg.map(c => ({ status: c._id, count: c.count }))
                }
            });
        }

        // Manager scope: attendance, leaves, projects, project announcements
        const [todayRecords, pendingLeaves, activeProjects, projectAnnouncementCount] = await Promise.all([
            Attendance.find({ dateString: todayString }).select('user status checkIn checkOut'),
            Leave.countDocuments({ status: 'Pending' }),
            Project.countDocuments({ status: 'Active' }),
            Announcement.countDocuments({ type: 'project' })
        ]);

        const totalStaff = await User.countDocuments({ role: { $in: ['Employee', 'Manager'] }, ...ACTIVE_ONLY });
        const present = todayRecords.filter(r => r.status === 'Present').length;
        const late = todayRecords.filter(r => r.status === 'Late').length;
        const checkedIn = present + late;
        const absent = Math.max(0, totalStaff - checkedIn);
        const rate = totalStaff > 0 ? Math.round((checkedIn / totalStaff) * 1000) / 10 : 0;

        // Leave stats for charts
        const allLeaves = await Leave.find().select('status');
        const leaveStats = {
            pending: allLeaves.filter(l => l.status === 'Pending').length,
            approved: allLeaves.filter(l => l.status === 'Approved').length,
            rejected: allLeaves.filter(l => l.status === 'Rejected').length
        };

        return res.status(200).json({
            success: true,
            role: 'Manager',
            data: {
                todayAttendance: { present, late, absent, checkedIn, rate },
                pendingLeaves,
                activeProjects,
                projectAnnouncementCount,
                leaveStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSummary };
