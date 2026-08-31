const Project = require('../models/projectModel');
// [LEARNING NOTE]: Imported User model here as well so we can track project activities!
const User = require('../models/userModel'); 

// GET /api/projects — all projects (Manager only)
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('team.user', 'name profilePhoto')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/projects — create project (Manager only)
const createProject = async (req, res) => {
    try {
        const { title, overview, priority, status, progress, team, dueDate } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
        const project = await Project.create({ title, overview, priority, status, progress, team, dueDate });
        await project.populate('team.user', 'name profilePhoto');
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/projects/me — projects the logged-in user belongs to
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        const projects = await Project.find({ 'team.user': userId })
            .populate('team.user', 'name profilePhoto')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            stats: {
                total: projects.length,
                active: projects.filter(p => p.status === 'Active').length,
                completed: projects.filter(p => p.status === 'Completed').length,
            },
            projects,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/projects/:id — update project (Manager only)
const updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const { title, overview, priority, status, progress, team, dueDate } = req.body;
        const userId = req.user._id; // [LEARNING NOTE]: Extracting userId to know WHO made the edit

        const update = {};
        if (title !== undefined) update.title = title;
        if (overview !== undefined) update.overview = overview;
        if (priority !== undefined) update.priority = priority;
        if (status !== undefined) update.status = status;
        if (progress !== undefined) update.progress = progress;
        if (team !== undefined) update.team = team;
        if (dueDate !== undefined) update.dueDate = dueDate;

        const project = await Project.findByIdAndUpdate(
            projectId,
            update,
            { new: true, runValidators: true }
        ).populate('team.user', 'name profilePhoto');

        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // [LEARNING NOTE]: Log the overall project update
        if (status) {
            await User.findByIdAndUpdate(userId, {
                $push: {
                    activities: {
                        $each: [{ action: `Updated project status to ${status}`, date: new Date() }],
                        $position: 0
                    }
                }
            });
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/projects/:id — delete project (Manager only)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/projects/:projectId/tasks/:taskId
const updateTaskStatus = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { status } = req.body; // e.g., "Done"
        const userId = req.user._id; // [LEARNING NOTE]: Grabbing the user ID here too!

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const task = project.tasks.id(taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        task.status = status;
        await project.save();

        // [LEARNING NOTE]: Log the specific task update. We use task.title to be precise!
        await User.findByIdAndUpdate(userId, {
            $push: {
                activities: {
                    $each: [{ action: `Updated task '${task.title || 'Task'}' to ${status}`, date: new Date() }],
                    $position: 0
                }
            }
        });

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllProjects, createProject, getMyProjects, updateProject, deleteProject, updateTaskStatus };