const User = require('../../models/userModel');
const { sendCVFile } = require('../profileController');

const ADMIN_CREATABLE_ROLES = ['Employee', 'Manager'];

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

// @desc    List all users (filterable by role / search)
// @route   GET /api/admin/users
const listUsers = async (req, res) => {
    try {
        const { role, search, status } = req.query;
        const query = {};

        if (role) query.role = role;

        // Records created before the status field existed have no value, so
        // "Active" must match missing as well as explicitly Active.
        if (status === 'Active') query.status = { $ne: 'Inactive' };
        else if (status) query.status = status;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
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
