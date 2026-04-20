const User = require('../../models/userModel');

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
        const { role, search } = req.query;
        const query = {};

        if (role) query.role = role;
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
            const adminCount = await User.countDocuments({ role: 'Admin' });
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
            'emergencyContact', 'medicalDetails', 'skills'
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

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.user && req.user._id.toString() === user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        if (user.role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last Admin'
                });
            }
        }

        await user.deleteOne();
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };
