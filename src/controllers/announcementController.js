const Announcement = require('../models/announcementModel');

// ==========================================
// @desc    Get announcements filtered by caller role
// @route   GET /api/announcements
// ==========================================
const getAnnouncements = async (req, res) => {
    // WHY TRY/CATCH? Database queries (like .find) rely on network connections. 
    // If the MongoDB database is temporarily offline or times out, it throws an error.
    // The try/catch catches that error so the whole Node.js server doesn't crash, 
    // and sends a safe 500 status code to the frontend instead.
    try {
        const role = req.user.role;

        let filter = {};
        if (role === 'Admin') {
            filter.type = 'system'; // Admins only see company-wide notices
        } else if (role === 'Manager') {
            filter.type = 'project'; // Managers only see project-level notices
        }
        // If it's an Employee, the filter remains empty {}, meaning they see ALL announcements.

        const announcements = await Announcement.find(filter)
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });

        // Calculate dynamic stats for the top of the frontend page
        const total = announcements.length;
        const urgent = announcements.filter(a => a.priority === 'Urgent').length;
        const important = announcements.filter(a => a.priority === 'Important').length;

        res.status(200).json({
            success: true,
            stats: { total, urgent, important },
            announcements
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// @desc    Get count of unread announcements for the user
// @route   GET /api/announcements/unread-count
// ==========================================
const getUnreadCount = async (req, res) => {
    // WHY TRY/CATCH? We are asking the database to count documents. If the query syntax 
    // is wrong or the database connection drops, we catch the error safely.
    try {
        const role = req.user.role;
        let filter = {};
        
        if (role === 'Admin') filter.type = 'system';
        else if (role === 'Manager') filter.type = 'project';

        // Find announcements where the user's specific ID is NOT ($ne) inside the readBy array
        filter.readBy = { $ne: req.user._id };

        const count = await Announcement.countDocuments(filter);
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Toggle read/unread status for an announcement
// @route   PUT /api/announcements/:id/read
const toggleReadStatus = async (req, res) => {
    try {
        const { isRead } = req.body;
        const userId = req.user._id;
        
        let updateQuery;
        if (isRead) {
            // $addToSet is a MongoDB superpower. It safely creates the readBy array 
            // if it is missing, pushes the ID, and guarantees no duplicates!
            updateQuery = { $addToSet: { readBy: userId } };
        } else {
            // $pull safely removes the ID without crashing, even if the array doesn't exist
            updateQuery = { $pull: { readBy: userId } };
        }

        // findByIdAndUpdate is crucial here. It bypasses strict schema validation 
        // on old legacy fields, ensuring the update never crashes on outdated documents.
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            req.params.id,
            updateQuery,
            { new: true } // This tells MongoDB to return the newly updated document
        ).populate('postedBy', 'name');

        if (!updatedAnnouncement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        console.error("Error in toggleReadStatus:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// @desc    Create announcement
// @route   POST /api/announcements
// ==========================================
const createAnnouncement = async (req, res) => {
    // WHY TRY/CATCH? When creating new data, the database runs validation rules 
    // (like "is the title string too long?" or "is the required content missing?"). 
    // If validation fails, Mongoose throws a ValidationError, which we catch and send back.
    try {
        const role = req.user.role;
        
        // Security check: Employees cannot create announcements
        if (role !== 'Admin' && role !== 'Manager') {
            return res.status(403).json({ success: false, message: 'Only Admin or Manager can create announcements' });
        }
        
        const { title, content, priority } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, message: 'Please provide title and content' });

        const type = role === 'Admin' ? 'system' : 'project';
        const newAnnouncement = await Announcement.create({
            title, 
            content, 
            priority, 
            type, 
            postedBy: req.user._id, 
            readBy: [] // Initialize empty readBy array for all new announcements
        });
        
        const populated = await newAnnouncement.populate('postedBy', 'name');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// @desc    Update announcement
// @route   PUT /api/announcements/:id
// ==========================================
const updateAnnouncement = async (req, res) => {
    // WHY TRY/CATCH? Just like creation, updates trigger database validation rules. 
    // It also protects the server if the req.params.id is invalid or corrupted.
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

        const role = req.user.role;
        // Strict Security: Admins can only edit system notices, Managers can only edit project notices
        if ((role === 'Admin' && announcement.type !== 'system') || (role === 'Manager' && announcement.type !== 'project')) {
            return res.status(403).json({ success: false, message: 'You cannot edit this announcement' });
        }

        const { title, content, priority } = req.body;
        if (title !== undefined) announcement.title = title;
        if (content !== undefined) announcement.content = content;
        if (priority !== undefined) announcement.priority = priority;

        const saved = await announcement.save();
        const populated = await saved.populate('postedBy', 'name');
        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// ==========================================
const deleteAnnouncement = async (req, res) => {
    // WHY TRY/CATCH? Protects against database connection failures during the deletion 
    // process, or invalid MongoDB ObjectId formats passed in the URL.
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

        const role = req.user.role;
        // Strict Security check before deletion
        if ((role === 'Admin' && announcement.type !== 'system') || (role === 'Manager' && announcement.type !== 'project')) {
            return res.status(403).json({ success: false, message: 'You cannot delete this announcement' });
        }

        await announcement.deleteOne();
        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getAnnouncements, 
    getUnreadCount, 
    toggleReadStatus, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
};