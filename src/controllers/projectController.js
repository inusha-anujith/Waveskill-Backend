const Project = require('../models/projectModel');

// @desc    Create a new project (Usually for managers, but we need it for testing!)
// @route   POST /api/projects
const createProject = async (req, res) => {
    try {
        const project = await Project.create(req.body);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user's projects and calculate dashboard stats
// @route   GET /api/projects/me
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all projects where this user is inside the "team" array
        const projects = await Project.find({ 'team.user': userId })
            .populate('team.user', 'name') // Pulls the actual names of team members for your UI
            .sort({ createdAt: -1 });

        // Calculate the summary stats for your 3 UI cards at the bottom!
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'Active').length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;

        res.status(200).json({
            success: true,
            stats: {
                total: totalProjects,
                active: activeProjects,
                completed: completedProjects
            },
            projects // This array feeds your main Project Cards and the expansion view
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Project Progress and Status (from the right-side panels)
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { progress, status } = req.body; // Data sent from your slider and dropdown

        // Find the project and update it
        const project = await Project.findByIdAndUpdate(
            projectId,
            { progress, status },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a specific Task's status (To Do, In Progress, Done)
// @route   PUT /api/projects/:projectId/tasks/:taskId
const updateTaskStatus = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { status } = req.body; // e.g., "Done"

        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Find the specific task inside the project's task array
        const task = project.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Update the task status and save the whole project
        task.status = status;
        await project.save();

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createProject, getMyProjects, updateProject, updateTaskStatus };