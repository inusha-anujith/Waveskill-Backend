const User = require('../models/userModel');
const Leave = require('../models/leaveModel');

// @desc    Get logged in user's full profile data (Overview, Leave Balance, Skills, Emergency)
// @route   GET /api/profile/me
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get the user data (excluding the password!)
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Get the Leave Balance data
        const leaves = await Leave.find({ user: userId });
        
        let approvedDays = 0;
        let pendingDays = 0;

        leaves.forEach(leave => {
            if (leave.status === 'Approved') approvedDays += leave.days;
            if (leave.status === 'Pending') pendingDays += leave.days;
        });

        // Calculate available days based on the allocation in the user model
        const availableDays = user.totalAnnualLeave - approvedDays;

        res.status(200).json({
            success: true,
            user,
            leaveBalance: {
                totalAnnualLeave: user.totalAnnualLeave,
                approvedDays,
                pendingDays,
                availableDays,
                usedDays: approvedDays // Same as approved for now
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user profile (from the "Edit Profile" modal)
// @route   PUT /api/profile/update
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Fields the employee is allowed to change via the modal
        const { phoneNumber, homeAddress, emergencyContact } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                phoneNumber,
                homeAddress,
                emergencyContact
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMyProfile, updateProfile };