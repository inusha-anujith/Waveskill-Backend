const express = require('express');
const router = express.Router();
// [NEW]: Import the multer middleware
const upload = require('../middleware/uploadMiddleware'); 

const {
    getMyProfile,
    updateProfile,
    uploadCV,
    getMyCV
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');

// The route to load the full profile page
router.get('/me', protect, getMyProfile);

// The route to save changes from the "Edit Profile" modal
router.put('/update', protect, updateProfile);

// [NEW]: The route to handle CV file uploads
// Notice the 'protect' middleware is added so the server knows exactly who is uploading the file!
router.post('/upload-cv', protect, upload.single('cvFile'), uploadCV);

// Lets an employee open their own uploaded CV
router.get('/cv', protect, getMyCV);

module.exports = router;