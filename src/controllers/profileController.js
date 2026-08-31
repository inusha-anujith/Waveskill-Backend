const fs = require('fs');
const path = require('path');
const User = require('../models/userModel');
const Leave = require('../models/leaveModel');
const bcrypt = require('bcryptjs'); // [NEW]: Required to securely compare the old password
const { CV_UPLOAD_DIR } = require('../middleware/uploadMiddleware');

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

// @desc    Store an uploaded CV against the logged-in user
// @route   POST /api/profile/upload-cv
const uploadCV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove the previously uploaded CV so old files do not pile up on disk.
        if (user.cvFile) {
            const previous = path.join(CV_UPLOAD_DIR, path.basename(user.cvFile));
            fs.promises.unlink(previous).catch(() => { /* already gone, nothing to do */ });
        }

        // Store only the filename. Building the absolute path at read time keeps
        // the record portable between machines and prevents path traversal.
        user.cvFile = req.file.filename;
        user.cvUpdateStatus = 'Pending Review';
        user.activities.unshift({ action: 'Uploaded a new CV', date: new Date() });
        await user.save();

        res.status(200).json({
            success: true,
            message: 'CV Uploaded!',
            cvFile: user.cvFile,
            cvUpdateStatus: user.cvUpdateStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Streams a stored CV back to the client. Shared by the employee-facing
// /api/profile/cv and the admin-facing /api/admin/users/:id/cv so both apply
// the same traversal guard and the same missing-file handling.
const sendCVFile = (res, user) => {
    if (!user.cvFile) {
        return res.status(404).json({ success: false, message: 'No CV has been uploaded for this user' });
    }

    // basename() ensures a tampered DB value cannot walk out of the upload dir.
    const absolutePath = path.join(CV_UPLOAD_DIR, path.basename(user.cvFile));

    if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({
            success: false,
            message: 'CV record exists but the file is missing from the server'
        });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${user.name.replace(/[^\w\-]/g, '_')}_CV.pdf"`);
    return res.sendFile(absolutePath);
};

// @desc    Logged-in user views their own CV
// @route   GET /api/profile/cv
const getMyCV = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('name cvFile');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return sendCVFile(res, user);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getMyProfile, updateProfile, changePassword, uploadCV, getMyCV, sendCVFile };