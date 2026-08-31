const express = require('express');
const router = express.Router();
// [NEW]: Import the multer middleware
const upload = require('../middleware/uploadMiddleware'); 

const {
    getMyProfile,
    updateProfile
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');

// The route to load the full profile page
router.get('/me', protect, getMyProfile);

// The route to save changes from the "Edit Profile" modal
router.put('/update', protect, updateProfile);

// [NEW]: The route to handle CV file uploads
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