const Leave = require('../../models/leaveModel');
const { findUserIdsMatching } = require('../../utils/queryHelpers');

// @desc    List leave requests, optionally filtered by status / search
// @route   GET /api/admin/leaves?status=Pending&search=
const listLeaves = async (req, res) => {
    try {
        const { status, userId, search } = req.query;
        const query = {};
        if (status && status !== 'All') query.status = status;
        if (userId) query.user = userId;

        // Leave references the user, so a name search resolves ids first.
        if (search && search.trim()) {
            query.user = { $in: await findUserIdsMatching(search) };
        }

        // Counted across all leave requests so the status cards do not collapse
        // to whatever filter is currently applied.
        const [leaves, pending, approved, rejected] = await Promise.all([
            Leave.find(query)
                .populate('user', 'name email role department position employeeId')
                .sort({ createdAt: -1 }),
            Leave.countDocuments({ status: 'Pending' }),
            Leave.countDocuments({ status: 'Approved' }),
            Leave.countDocuments({ status: 'Rejected' })
        ]);

        res.status(200).json({
            success: true,
            count: leaves.length,
            stats: { pending, approved, rejected },
            data: leaves
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const setLeaveStatus = (newStatus) => async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Leave is already ${leave.status} and cannot be changed`
            });
        }

        leave.status = newStatus;
        const saved = await leave.save();
        const populated = await saved.populate('user', 'name email role department position employeeId');

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const approveLeave = setLeaveStatus('Approved');
const rejectLeave = setLeaveStatus('Rejected');

module.exports = { listLeaves, approveLeave, rejectLeave };
