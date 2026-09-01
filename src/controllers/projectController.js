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
        // Populate before responding so callers can refresh from the response
        // without losing team names/photos.
        await project.populate('team.user', 'name profilePhoto');

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

// Every mutation below returns the fully populated project so the client can
// refresh straight from the response instead of guessing at local state.
const populated = (project) => project.populate('team.user', 'name profilePhoto');

// Mirrors the enum on the task subdocument in projectModel.
const TASK_STATUSES = ['To Do', 'In Progress', 'Done'];

// POST /api/projects/:id/tasks — add a task (Manager only)
const addTask = async (req, res) => {
    try {
        const { title, status, assignedTo } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Task title is required' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        project.tasks.push({
            title: title.trim(),
            status: status || 'To Do',
            ...(assignedTo ? { assignedTo } : {})
        });
        await project.save();
        await populated(project);

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/projects/:id/tasks/:taskId — remove a task (Manager only)
const deleteTask = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const task = project.tasks.id(req.params.taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        task.deleteOne();
        await project.save();
        await populated(project);

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/projects/:id/tasks/:taskId — edit a task (Manager only)
// Separate from the PUT status route, which stays open to any authenticated
// user so employees can progress their own tasks without being able to rename
// them.
const editTask = async (req, res) => {
    try {
        const { title, status } = req.body;

        if (title === undefined && status === undefined) {
            return res.status(400).json({ success: false, message: 'Provide a title or a status to update' });
        }
        if (title !== undefined && !String(title).trim()) {
            return res.status(400).json({ success: false, message: 'Task title cannot be empty' });
        }
        if (status !== undefined && !TASK_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${TASK_STATUSES.join(', ')}`
            });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const task = project.tasks.id(req.params.taskId);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (title !== undefined) task.title = String(title).trim();
        if (status !== undefined) task.status = status;

        await project.save();
        await populated(project);

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/projects/:id/team — assign one or more employees (Manager only)
// Accepts { userId } or { userIds: [...] }. Ids that are unknown or already on
// the project are skipped and reported rather than failing the whole request,
// so assigning a batch never half-succeeds with an error.
const addTeamMember = async (req, res) => {
    try {
        const { userId, userIds, role } = req.body;

        const requested = Array.isArray(userIds) && userIds.length
            ? userIds
            : (userId ? [userId] : []);

        if (!requested.length) {
            return res.status(400).json({ success: false, message: 'Select at least one employee' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const users = await User.find({ _id: { $in: requested } }).select('name');
        const byId = new Map(users.map((u) => [String(u._id), u]));

        const onProject = new Set(project.team.filter(m => m.user).map((m) => String(m.user)));
        const added = [];
        const alreadyAssigned = [];

        for (const id of requested) {
            const user = byId.get(String(id));
            if (!user) continue;                       // unknown id — ignore
            if (onProject.has(String(id))) { alreadyAssigned.push(user.name); continue; }

            project.team.push({ user: id, role: role || 'Team Member' });
            onProject.add(String(id));                 // guards duplicates within one request
            added.push(user.name);
        }

        if (!added.length) {
            return res.status(400).json({
                success: false,
                message: alreadyAssigned.length
                    ? `${alreadyAssigned.join(', ')} ${alreadyAssigned.length === 1 ? 'is' : 'are'} already on this project`
                    : 'No valid employees to assign'
            });
        }

        await project.save();
        await populated(project);

        res.status(200).json({ success: true, added, skipped: alreadyAssigned, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/projects/:id/team/:userId — unassign an employee (Manager only)
const removeTeamMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const before = project.team.length;
        // Filter by the referenced user id rather than the subdocument id, which
        // is what the client actually knows about.
        project.team = project.team.filter((m) => String(m.user) !== String(req.params.userId));

        if (project.team.length === before) {
            return res.status(404).json({ success: false, message: 'That employee is not assigned to this project' });
        }

        await project.save();
        await populated(project);

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllProjects,
    createProject,
    getMyProjects,
    updateProject,
    deleteProject,
    updateTaskStatus,
    addTask,
    editTask,
    deleteTask,
    addTeamMember,
    removeTeamMember
};