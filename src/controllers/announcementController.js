const Announcement = require('../models/announcementModel');

// @desc    Get all announcements for the Employee Dashboard
// @route   GET /api/announcements
const getAnnouncements = async (req, res) => {
    try {
        // Fetch all announcements, newest first, and get the actual name of the Admin who posted it
        const announcements = await Announcement.find()
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });

        // Calculate the summary stats for your 3 UI cards at the bottom!
        const total = announcements.length;
        const urgent = announcements.filter(a => a.priority === 'Urgent').length;
        const important = announcements.filter(a => a.priority === 'Important').length;

        res.status(200).json({
            success: true,
            stats: {
                total,
                urgent,
                important
            },
            announcements // This array feeds directly into your large announcement cards!
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new announcement (Admin feature, but needed for testing right now!)
// @route   POST /api/announcements
const createAnnouncement = async (req, res) => {
    try {
        const { title, content, priority } = req.body;
        
        // This makes sure the logged-in user's ID is attached as the author
        const userId = req.user._id; 

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Please provide title and content' });
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            priority,
            postedBy: userId
        });

        res.status(201).json({ success: true, data: newAnnouncement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAnnouncements, createAnnouncement };