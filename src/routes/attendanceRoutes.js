const express = require('express');
const router = express.Router();

const {
    checkIn,
    checkOut,
    getMyAttendance
} = require('../controllers/attendanceController');

// Import your security middleware!
const { protect } = require('../middleware/auth');

// Apply the protect middleware to all attendance routes
// because the controller needs to know WHO is checking in (req.user)
router.post('/checkin', protect, checkIn);
router.put('/checkout', protect, checkOut);
router.get('/me', protect, getMyAttendance);

module.exports = router;
