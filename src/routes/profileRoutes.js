const express = require('express');
const router = express.Router();
// Import the multer middleware for handling local file storage
const upload = require('../middleware/uploadMiddleware'); 

const {
    getMyProfile,
    updateProfile,
    changePassword, // [NEW]: Imported the new password controller,
    uploadCV,
    getMyCV
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');

// ==========================================
// @route   GET /api/profile/me
// @desc    Load the full profile page data
// ==========================================
router.get('/me', protect, getMyProfile);

// ==========================================
// @route   PUT /api/profile/update
// @desc    Save changes from the "Edit Profile" modal
// ==========================================
router.put('/update', protect, updateProfile);

// ==========================================
// @route   PUT /api/profile/change-password
// @desc    Allow an employee to securely reset their assigned password
// ==========================================
router.put('/change-password', protect, changePassword);

// ==========================================
// @route   POST /api/profile/upload-cv
// @desc    Save uploaded PDFs to the local uploads/cvs directory
// ==========================================
// Notice the 'protect' middleware is added so the server knows exactly who is uploading the file!
router.post('/upload-cv', protect, upload.single('cvFile'), uploadCV);

// Lets an employee open their own uploaded CV
router.get('/cv', protect, getMyCV);

module.exports = router;