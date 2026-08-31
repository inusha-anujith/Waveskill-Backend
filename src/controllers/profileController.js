const User = require('../models/userModel');
const Leave = require('../models/leaveModel');
const bcrypt = require('bcryptjs'); // [NEW]: Required to securely compare the old password

// ==========================================
// @desc    Get logged in user's full profile data (Overview, Leave Balance, Skills, Emergency)
// @route   GET /api/profile/me
// ==========================================
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

// ==========================================
// @desc    Update user profile (from the "Edit Profile" modal)
// @route   PUT /api/profile/update
// ==========================================
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

// ==========================================
// @desc    Change User Password
// @route   PUT /api/profile/change-password
// ==========================================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 1. Verify the frontend sent both required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both your current password and a new password.' });
        }

        // 2. Fetch the user. We use .select('+password') in case your User model hides it by default
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // 3. Verify the current password matches the encrypted hash in the database
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'The current password you entered is incorrect.' });
        }

        // 4. Assign the new password and save (This relies on the pre('save') hook in your User model to hash it)
        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Export the new function alongside the existing ones
module.exports = { getMyProfile, updateProfile, changePassword };