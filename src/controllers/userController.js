const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Public self-registration is always Employee. Admin/Manager accounts
        // must go through POST /api/admin/users.
        const user = await User.create({ name, email, password, role: 'Employee' });

        res.status(201).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user (Login)
// @route   POST /api/users/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get logged-in user profile
// @route   GET /api/users/me
const getUserProfile = async (req, res) => {
    try {
        // req.user._id comes from the protect middleware
        const user = await User.findById(req.user._id).select('-password');
        
        if (user) {
            res.status(200).json({ success: true, data: user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update logged-in user profile
// @route   PUT /api/users/me
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Update fields if they were provided in the request body
            user.phoneNumber = req.body.phone || user.phoneNumber;
            user.homeAddress = req.body.address || user.homeAddress;
            
            // Handle the nested emergencyContact object safely
            if (!user.emergencyContact) user.emergencyContact = {};
            user.emergencyContact.name = req.body.emergencyContact || user.emergencyContact.name;
            user.emergencyContact.phone = req.body.emergencyPhone || user.emergencyContact.phone;

            const updatedUser = await user.save();

            // Send back the updated data (excluding password)
            const userData = updatedUser.toObject();
            delete userData.password;

            res.status(200).json({ success: true, data: userData });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };