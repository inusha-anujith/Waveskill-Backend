const User = require('../../models/userModel');
const { sendCVFile } = require('../profileController');
const { buildSearchRegex } = require('../../utils/queryHelpers');

const ADMIN_CREATABLE_ROLES = ['Employee', 'Manager'];

// Documents predating the status field have no value, so "active" is
// "not explicitly Inactive" rather than an equality match.
const ACTIVE_MATCH = { $ne: 'Inactive' };

// Stat cards must describe the whole collection, not the current search
// results — otherwise searching "john" would make "Total Employees" read 1.
// Deliberately ignores every filter on the request.
const buildUserStats = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalEmployees, totalManagers, inactiveCount, recentJoins, cvUpToDate, activeStaff] =
        await Promise.all([
            User.countDocuments({ role: 'Employee', status: ACTIVE_MATCH }),
            User.countDocuments({ role: 'Manager', status: ACTIVE_MATCH }),
            User.countDocuments({ status: 'Inactive' }),
            User.countDocuments({
                role: { $in: ['Employee', 'Manager'] },
                status: ACTIVE_MATCH,
                joinDate: { $gte: thirtyDaysAgo }
            }),
            User.countDocuments({
                role: { $ne: 'Admin' },
                status: ACTIVE_MATCH,
                cvUpdateStatus: 'Up to Date'
            }),
            User.countDocuments({ role: { $ne: 'Admin' }, status: ACTIVE_MATCH })
        ]);

    return { totalEmployees, totalManagers, inactiveCount, recentJoins, cvUpToDate, activeStaff };
};

const sanitize = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
};

// @desc    Admin creates a new Employee or Manager
// @route   POST /api/admin/users
const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            department,
            position,
            employeeId,
            phoneNumber,
            homeAddress,
            joinDate,
            totalAnnualLeave
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'name, email, password and role are required'
            });
        }

        if (!ADMIN_CREATABLE_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `role must be one of: ${ADMIN_CREATABLE_ROLES.join(', ')}`
            });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            department,
            position,
            employeeId,
            phoneNumber,
            homeAddress,
            joinDate,
            totalAnnualLeave
        });

        res.status(201).json({ success: true, data: sanitize(user) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    List users, filterable by role / department / status / search
// @route   GET /api/admin/users
const listUsers = async (req, res) => {
    try {
        const { role, search, status, department } = req.query;
        const query = {};

        if (role) query.role = role;

        // Records created before the status field existed have no value, so
        // "Active" must match missing as well as explicitly Active.
        if (status === 'Active') query.status = ACTIVE_MATCH;
        else if (status) query.status = status;

        if (department) {
            // department defaults to 'Unassigned', but older documents may not
            // have the field at all — those belong under 'Unassigned' too.
            query.department = department === 'Unassigned'
                ? { $in: ['Unassigned', null] }
                : department;
        }

        if (search) {
            const regex = buildSearchRegex(search);
            query.$or = [
                { name: regex },
                { email: regex },
                { employeeId: regex }
            ];
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            stats: await buildUserStats(),
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user (role, profile fields, etc.)
// @route   PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Block self-demotion of the last Admin
        if (req.body.role && user.role === 'Admin' && req.body.role !== 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin', status: { $ne: 'Inactive' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot demote the last Admin'
                });
            }
        }

        const allowed = [
            'name', 'email', 'role', 'department', 'position', 'employeeId',
            'phoneNumber', 'homeAddress', 'joinDate', 'totalAnnualLeave',
            'emergencyContact', 'medicalDetails', 'skills',
            'maritalStatus', 'cvUpdateStatus'
        ];
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) user[key] = req.body[key];
        });

        // Allow password reset by Admin if explicitly provided
        if (req.body.password) {
            user.password = req.body.password;
        }

        const saved = await user.save();
        res.status(200).json({ success: true, data: sanitize(saved) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Deactivate a user (soft delete — the record is retained so that
//          attendance, leave and OT history keeps resolving)
// @route   PATCH /api/admin/users/:id/deactivate  (DELETE is kept as an alias)
const deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.user && req.user._id.toString() === user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
        }

        if (user.status === 'Inactive') {
            return res.status(400).json({ success: false, message: 'This account is already inactive' });
        }

        // Guard the last *active* Admin, not merely the last Admin document —
        // otherwise deactivating every admin in turn would lock everyone out.
        if (user.role === 'Admin') {
            const activeAdmins = await User.countDocuments({
                role: 'Admin',
                status: { $ne: 'Inactive' }
            });
            if (activeAdmins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate the last active Admin'
                });
            }
        }

        user.status = 'Inactive';
        user.deactivatedAt = new Date();
        user.deactivatedBy = req.user ? req.user._id : undefined;
        user.activities.unshift({ action: 'Account deactivated by an administrator', date: new Date() });
        await user.save();

        res.status(200).json({ success: true, message: 'User deactivated', data: sanitize(user) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Restore a previously deactivated user
// @route   PATCH /api/admin/users/:id/reactivate
const reactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.status !== 'Inactive') {
            return res.status(400).json({ success: false, message: 'This account is already active' });
        }

        user.status = 'Active';
        user.deactivatedAt = undefined;
        user.deactivatedBy = undefined;
        user.activities.unshift({ action: 'Account reactivated by an administrator', date: new Date() });
        await user.save();

        res.status(200).json({ success: true, message: 'User reactivated', data: sanitize(user) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin/Manager views a given employee's uploaded CV
// @route   GET /api/admin/users/:id/cv
const getUserCV = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name cvFile');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return sendCVFile(res, user);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createUser,
    listUsers,
    getUserById,
    updateUser,
    deactivateUser,
    reactivateUser,
    getUserCV
};
