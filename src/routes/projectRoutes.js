const express = require('express');
const router = express.Router();

const {
    getMyProjects,
    updateProject,
    updateTaskStatus,
    createProject // <-- Our new testing function!
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

// The Routes!
router.post('/', protect, createProject); // To make a project
router.get('/me', protect, getMyProjects); // To get your dashboard stats
router.put('/:id', protect, updateProject); // To update progress/status
router.put('/:projectId/tasks/:taskId', protect, updateTaskStatus); // To check off tasks

module.exports = router;