const express = require('express');
const router = express.Router();

const {
    applyForLeave,
    getMyLeaves,
    cancelLeave // <-- Import the new function!
} = require('../controllers/leaveController');

const { protect } = require('../middleware/auth');

router.post('/apply', protect, applyForLeave);
router.get('/me', protect, getMyLeaves);

// Add the new DELETE route here
router.delete('/:id', protect, cancelLeave); 

module.exports = router;