const OTRequest = require('../../models/otRequestModel');

// @desc    Manager lists all OT requests
// @route   GET /api/admin/ot
const listOTRequests = async (req, res) => {
    try {
        if (req.user.role !== 'Manager') {
            return res.status(403).json({ success: false, message: 'Only Managers can access OT requests' });
        }

        const { status, userId } = req.query;
        const query = {};
        if (status) query.status = status;
        if (userId) query.user = userId;

        const requests = await OTRequest.find(query)
            .populate('user', 'name email department position')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        const pending = requests.filter(r => r.status === 'Pending').length;
        const approved = requests.filter(r => r.status === 'Approved').length;
        const rejected = requests.filter(r => r.status === 'Rejected').length;

        res.status(200).json({
            success: true,
            stats: { pending, approved, rejected },
            count: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Manager approves an OT request
// @route   PATCH /api/admin/ot/:id/approve
const approveOT = async (req, res) => {
    try {
        if (req.user.role !== 'Manager') {
            return res.status(403).json({ success: false, message: 'Only Managers can approve OT requests' });
        }

        const request = await OTRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'OT request not found' });
        }
        if (request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
        }

        request.status = 'Approved';
        request.reviewedBy = req.user._id;
        request.reviewNote = req.body.reviewNote || '';
        await request.save();

        const populated = await request.populate([
            { path: 'user', select: 'name email' },
            { path: 'reviewedBy', select: 'name' }
        ]);
        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Manager rejects an OT request
// @route   PATCH /api/admin/ot/:id/reject
const rejectOT = async (req, res) => {
    try {
        if (req.user.role !== 'Manager') {
            return res.status(403).json({ success: false, message: 'Only Managers can reject OT requests' });
        }

        const request = await OTRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'OT request not found' });
        }
        if (request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
        }

        request.status = 'Rejected';
        request.reviewedBy = req.user._id;
        request.reviewNote = req.body.reviewNote || '';
        await request.save();

        const populated = await request.populate([
            { path: 'user', select: 'name email' },
            { path: 'reviewedBy', select: 'name' }
        ]);
        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { listOTRequests, approveOT, rejectOT };
