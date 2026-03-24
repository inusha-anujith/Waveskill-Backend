const express = require('express');
const router = express.Router();

const {
    getAnnouncements,
    createAnnouncement
} = require('../controllers/announcementController');

const { protect } = require('../middleware/auth');

// Employees only need to GET announcements, but we need POST to test it right now!
router.get('/', protect, getAnnouncements);
router.post('/', protect, createAnnouncement);

module.exports = router;