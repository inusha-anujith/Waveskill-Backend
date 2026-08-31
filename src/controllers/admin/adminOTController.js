const OTRequest = require('../../models/otRequestModel');
const { findUserIdsMatching } = require('../../utils/queryHelpers');

// @desc    Manager lists all OT requests
// @route   GET /api/admin/ot
const listOTRequests = async (req, res) => {
    try {
        if (req.user.role !== 'Manager') {
            return res.status(403).json({ success: false, message: 'Only Managers can access OT requests' });
        }

        const { status, userId, search } = req.query;
        const query = {};
        if (status) query.status = status;
        if (userId) query.user = userId;

        // OTRequest references the user, so a name search resolves matching
        // user ids first. An empty result correctly yields zero rows.
        if (search && search.trim()) {
            query.user = { $in: await findUserIdsMatching(search) };
        }

        // Counts are taken across all requests rather than the filtered rows,
        // so the Pending/Approved/Rejected totals do not collapse to the
        // current search or status selection.
        const [requests, pending, approved, rejected] = await Promise.all([
            OTRequest.find(query)
                .populate('user', 'name email department position')
                .populate('reviewedBy', 'name')
                .sort({ createdAt: -1 }),
            OTRequest.countDocuments({ status: 'Pending' }),
            OTRequest.countDocuments({ status: 'Approved' }),
            OTRequest.countDocuments({ status: 'Rejected' })
        ]);

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
