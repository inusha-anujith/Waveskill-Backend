const express = require('express');
const router = express.Router();
// Import the multer middleware for handling local file storage
const upload = require('../middleware/uploadMiddleware'); 

const {
    getMyProfile,
    updateProfile,
    changePassword // [NEW]: Imported the new password controller
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
router.post('/upload-cv', protect, upload.single('cvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // The relative path that Dasuni can use in the Admin module
        const filePath = req.file.path; 

        res.status(200).json({ success: true, message: 'CV Uploaded!', path: filePath });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;