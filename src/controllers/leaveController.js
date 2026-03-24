const Leave = require('../models/leaveModel');

// @desc    Apply for a new leave
// @route   POST /api/leave/apply
const applyForLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const userId = req.user._id;

        // 1. Basic validation
        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // 2. Calculate the total number of days
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Ensure end date is not before start date!
        if (end < start) {
            return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
        }

        // Math to calculate difference in days (adding 1 so same-day requests count as 1 day)
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

        // 3. Save to database
        const newLeave = await Leave.create({
            user: userId,
            leaveType,
            startDate,
            endDate,
            days: diffDays,
            reason
        });

        res.status(201).json({ success: true, data: newLeave });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user's leave history and stats
// @route   GET /api/leave/me
const getMyLeaves = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all leave records for this specific employee, newest first
        const history = await Leave.find({ user: userId }).sort({ createdAt: -1 });

        // Calculate the summary stats to feed your 4 UI boxes exactly!
        let totalDays = 0;
        let approvedDays = 0;
        let pendingDays = 0;
        let rejectedDays = 0;

        history.forEach(leave => {
            totalDays += leave.days;
            if (leave.status === 'Approved') approvedDays += leave.days;
            if (leave.status === 'Pending') pendingDays += leave.days;
            if (leave.status === 'Rejected') rejectedDays += leave.days;
        });

        res.status(200).json({
            success: true,
            stats: {
                totalDays,
                approvedDays,
                pendingDays,
                rejectedDays
            },
            history // This array feeds directly into your Leave History table!
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { applyForLeave, getMyLeaves };