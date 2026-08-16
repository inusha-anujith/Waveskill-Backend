const Announcement = require('../models/announcementModel');

// @desc    Get announcements filtered by caller role
// @route   GET /api/announcements
const getAnnouncements = async (req, res) => {
    try {
        const role = req.user.role;

        let filter = {};
        if (role === 'Admin') {
            filter.type = 'system';
        } else if (role === 'Manager') {
            filter.type = 'project';
        }
        // Employee sees both types (no filter)

        const announcements = await Announcement.find(filter)
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });

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

// @desc    Create announcement – type auto-assigned by role
// @route   POST /api/announcements
const createAnnouncement = async (req, res) => {
    try {
        const role = req.user.role;

        if (role !== 'Admin' && role !== 'Manager') {
            return res.status(403).json({ success: false, message: 'Only Admin or Manager can create announcements' });
        }

        const { title, content, priority } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Please provide title and content' });
        }

        const type = role === 'Admin' ? 'system' : 'project';

        const newAnnouncement = await Announcement.create({
            title,
            content,
            priority,
            type,
            postedBy: req.user._id
        });

        const populated = await newAnnouncement.populate('postedBy', 'name');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update announcement (owner only: Admin→system, Manager→project)
// @route   PUT /api/announcements/:id
const updateAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const role = req.user.role;
        if (
            (role === 'Admin' && announcement.type !== 'system') ||
            (role === 'Manager' && announcement.type !== 'project')
        ) {
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

// @desc    Delete announcement (owner only by type)
// @route   DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const role = req.user.role;
        if (
            (role === 'Admin' && announcement.type !== 'system') ||
            (role === 'Manager' && announcement.type !== 'project')
        ) {
            return res.status(403).json({ success: false, message: 'You cannot delete this announcement' });
        }

        await announcement.deleteOne();
        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
