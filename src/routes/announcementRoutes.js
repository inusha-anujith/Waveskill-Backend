const express = require('express');
const router = express.Router();

const {
    getAnnouncements,
    getUnreadCount,
    toggleReadStatus,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');

const { protect } = require('../middleware/auth');

// [NEW] Must be placed ABOVE the /:id routes to prevent 'unread-count' from being treated as an ID
router.get('/unread-count', protect, getUnreadCount);

router.get('/', protect, getAnnouncements);
router.post('/', protect, createAnnouncement);

// [NEW] Route to mark read/unread
router.put('/:id/read', protect, toggleReadStatus);

router.put('/:id', protect, updateAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;