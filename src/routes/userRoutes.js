const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
} = require('../controllers/userController');

const { protect } = require('../middleware/auth'); // Import the protection middleware

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require a valid token)
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);

module.exports = router;