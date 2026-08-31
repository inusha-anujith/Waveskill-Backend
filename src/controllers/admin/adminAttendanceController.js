const Attendance = require('../../models/attendanceModel');
const { findUserIdsMatching } = require('../../utils/queryHelpers');

// @desc    List attendance records (admin/global) with filters and pagination
// @route   GET /api/admin/attendance?date=YYYY-MM-DD&from=&to=&userId=&status=&search=&page=&limit=
const listAttendance = async (req, res) => {
    try {
        const {
            date,
            from,
            to,
            userId,
            status,
            search,
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

        // Attendance references the user, so searching by name/email means
        // resolving matching user ids first. No match must yield zero rows —
        // an empty $in does exactly that, rather than falling back to all rows.
        if (search && search.trim()) {
            query.user = { $in: await findUserIdsMatching(search) };
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        // Stats describe the selected period and status, ignoring the search
        // term, so the Present/Late/Absent cards stay meaningful while the
        // table is narrowed to one person.
        const statsQuery = { ...query };
        delete statsQuery.user;
        delete statsQuery.status;

        const [records, total, present, late, absent] = await Promise.all([
            Attendance.find(query)
                .populate('user', 'name email role department position employeeId')
                .sort({ dateString: -1, checkIn: -1 })
                .skip(skip)
                .limit(limitNum),
            Attendance.countDocuments(query),
            Attendance.countDocuments({ ...statsQuery, status: 'Present' }),
            Attendance.countDocuments({ ...statsQuery, status: 'Late' }),
            Attendance.countDocuments({ ...statsQuery, status: 'Absent' })
        ]);

        res.status(200).json({
            success: true,
            count: records.length,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            stats: { present, late, absent, totalRecords: present + late + absent },
            data: records
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { listAttendance };
