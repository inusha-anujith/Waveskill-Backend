const Leave = require('../models/leaveModel');
// [LEARNING NOTE]: We import the User model here so this controller can update the activity log
const User = require('../models/userModel'); 

// @desc    Apply for a new leave
// @route   POST /api/leave/apply
const applyForLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const userId = req.user._id;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

        const newLeave = await Leave.create({
            user: userId,
            leaveType,
            startDate,
            endDate,
            days: diffDays,
            reason
        });

        // [LEARNING NOTE]: Push the activity to the very top (index 0) of the user's activities array
        await User.findByIdAndUpdate(userId, {
            $push: {
                activities: {
                    $each: [{ action: `Applied for ${leaveType}`, date: new Date() }],
                    $position: 0 
                }
            }
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

        const history = await Leave.find({ user: userId }).sort({ createdAt: -1 });

        let approvedDays = 0;
        let pendingDays = 0;
        let rejectedDays = 0;

        history.forEach(leave => {
            const days = leave.days || 1; 
            if (leave.status === 'Approved') approvedDays += days;
            if (leave.status === 'Pending') pendingDays += days;
            if (leave.status === 'Rejected') rejectedDays += days;
        });

        const totalLeaves = history.length; 
        const annualAllowance = 35; 
        const leaveBalance = annualAllowance - approvedDays;

        res.status(200).json({
            success: true,
            stats: {
                totalLeaves,
                approvedDays,
                pendingDays,
                rejectedDays,
                leaveBalance 
            },
            history 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cancel a pending leave request
// @route   DELETE /api/leave/:id
const cancelLeave = async (req, res) => {
    try {
        const leaveId = req.params.id;
        const userId = req.user._id;

        // 1. Find the exact leave request
        const leave = await Leave.findById(leaveId);

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        // 2. Security Check
        if (leave.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this leave' });
        }

        // 3. Logic Check
        if (leave.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'You can only cancel pending requests' });
        }

        // 4. Remove it completely from the database
        await Leave.findByIdAndDelete(leaveId);

        // [LEARNING NOTE]: Log the cancellation in the user's activity tab
        await User.findByIdAndUpdate(userId, {
            $push: {
                activities: {
                    $each: [{ action: `Canceled a ${leave.leaveType} request`, date: new Date() }],
                    $position: 0
                }
            }
        });

        res.status(200).json({ success: true, message: 'Leave canceled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { applyForLeave, getMyLeaves, cancelLeave };