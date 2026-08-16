const Leave = require('../../models/leaveModel');

// @desc    List leave requests, optionally filtered by status
// @route   GET /api/admin/leaves?status=Pending
const listLeaves = async (req, res) => {
    try {
        const { status, userId } = req.query;
        const query = {};
        if (status) query.status = status;
        if (userId) query.user = userId;

        const leaves = await Leave.find(query)
            .populate('user', 'name email role department position employeeId')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: leaves.length, data: leaves });
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
