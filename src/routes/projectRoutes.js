const express = require('express');
const router = express.Router();

const {
    getAllProjects,
    getMyProjects,
    createProject,
    updateProject,
    deleteProject,
    updateTaskStatus,
    addTask,
    editTask,
    deleteTask,
    addTeamMember,
    removeTeamMember,
} = require('../controllers/projectController');

const { protect, restrictTo } = require('../middleware/auth');

// Any authenticated user: their own projects.
// Declared before '/:id' style routes so 'me' is never treated as an id.
router.get('/me', protect, getMyProjects);

// Manager-only: full CRUD on all projects
router.get('/', protect, restrictTo('Manager'), getAllProjects);
router.post('/', protect, restrictTo('Manager'), createProject);
router.put('/:id', protect, restrictTo('Manager'), updateProject);
router.delete('/:id', protect, restrictTo('Manager'), deleteProject);

// Manager-only: task management
router.post('/:id/tasks', protect, restrictTo('Manager'), addTask);
router.patch('/:id/tasks/:taskId', protect, restrictTo('Manager'), editTask);
router.delete('/:id/tasks/:taskId', protect, restrictTo('Manager'), deleteTask);

// Manager-only: team assignment
router.post('/:id/team', protect, restrictTo('Manager'), addTeamMember);
router.delete('/:id/team/:userId', protect, restrictTo('Manager'), removeTeamMember);

// Any authenticated user: update the status of a task on a project they're on
router.put('/:projectId/tasks/:taskId', protect, updateTaskStatus);

module.exports = router;
