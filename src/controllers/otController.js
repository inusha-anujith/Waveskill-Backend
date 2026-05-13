const OTRequest = require('../models/otRequestModel');

// @desc    Employee submits an OT request
// @route   POST /api/ot
const submitOT = async (req, res) => {
    try {
        const { date, otHours, reason } = req.body;

        if (!date || !otHours || !reason) {
            return res.status(400).json({ success: false, message: 'date, otHours, and reason are required' });
        }

        if (otHours < 0.5 || otHours > 12) {
            return res.status(400).json({ success: false, message: 'otHours must be between 0.5 and 12' });
        }

        const request = await OTRequest.create({
            user: req.user._id,
            date,
            otHours,
            reason
        });

        const populated = await request.populate('user', 'name email department position');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Employee views own OT requests
// @route   GET /api/ot/me
const getMyOTRequests = async (req, res) => {
    try {
        const requests = await OTRequest.find({ user: req.user._id })
            .populate('reviewedBy', 'name')
            .sort({ date: -1 });

        const pending = requests.filter(r => r.status === 'Pending').length;
        const approved = requests.filter(r => r.status === 'Approved').length;
        const rejected = requests.filter(r => r.status === 'Rejected').length;
        const totalApprovedHours = requests
            .filter(r => r.status === 'Approved')
            .reduce((sum, r) => sum + r.otHours, 0);

        res.status(200).json({
            success: true,
            stats: { pending, approved, rejected, totalApprovedHours },
            data: requests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { submitOT, getMyOTRequests };
