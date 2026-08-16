const Attendance = require('../../models/attendanceModel');

// @desc    List attendance records (admin/global) with filters and pagination
// @route   GET /api/admin/attendance?date=YYYY-MM-DD&from=&to=&userId=&status=&page=&limit=
const listAttendance = async (req, res) => {
    try {
        const {
            date,
            from,
            to,
            userId,
            status,
            page = 1,
            limit = 50
        } = req.query;

        const query = {};

        if (userId) query.user = userId;
        if (status) query.status = status;

        if (date) {
            query.dateString = date;
        } else if (from || to) {
            query.dateString = {};
            if (from) query.dateString.$gte = from;
            if (to) query.dateString.$lte = to;
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        const [records, total] = await Promise.all([
            Attendance.find(query)
                .populate('user', 'name email role department position employeeId')
                .sort({ dateString: -1, checkIn: -1 })
                .skip(skip)
                .limit(limitNum),
            Attendance.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            count: records.length,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            data: records
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { listAttendance };
