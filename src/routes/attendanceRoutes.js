const express = require('express');
const router = express.Router();

const {
    checkIn,
    checkOut,
    requestOT,
    cancelOTRequest, // [NEW] Import the new function
    getMyAttendance
} = require('../controllers/attendanceController');

const { protect } = require('../middleware/auth');

router.post('/checkin', protect, checkIn);
router.put('/checkout', protect, checkOut);

router.post('/ot-request', protect, requestOT); 
// [NEW] Allow users to cancel their pending requests
router.delete('/ot-request/:id', protect, cancelOTRequest); 

router.get('/me', protect, getMyAttendance);

module.exports = router;