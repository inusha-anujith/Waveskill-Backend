const express = require('express');
const router = express.Router();

const {
    getMyProfile,
    updateProfile
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');

// The route to load the full profile page
router.get('/me', protect, getMyProfile);

// The route to save changes from the "Edit Profile" modal
router.put('/update', protect, updateProfile);

module.exports = router;