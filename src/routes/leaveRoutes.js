const express = require('express');
const router = express.Router();

const {
    applyForLeave,
    getMyLeaves
} = require('../controllers/leaveController');

// Import your security middleware!
const { protect } = require('../middleware/auth');

// Apply the protect middleware so the server knows exactly WHO is asking for leave
router.post('/apply', protect, applyForLeave);
router.get('/me', protect, getMyLeaves);

module.exports = router;