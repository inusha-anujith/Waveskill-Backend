const express = require('express');
const router = express.Router();

const {
    getAllProjects,
    getMyProjects,
    createProject,
    updateProject,
    deleteProject,
    updateTaskStatus,
} = require('../controllers/projectController');

const { protect, restrictTo } = require('../middleware/auth');

// Manager-only: full CRUD on all projects
router.get('/', protect, restrictTo('Manager'), getAllProjects);
router.post('/', protect, restrictTo('Manager'), createProject);
router.put('/:id', protect, restrictTo('Manager'), updateProject);
router.delete('/:id', protect, restrictTo('Manager'), deleteProject);

// Any authenticated user: their own projects + task updates
router.get('/me', protect, getMyProjects);
router.put('/:projectId/tasks/:taskId', protect, updateTaskStatus);

module.exports = router;
