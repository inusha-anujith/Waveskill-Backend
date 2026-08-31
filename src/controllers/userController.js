const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

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

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            // A deactivated account must not be able to sign in, otherwise
            // "Inactive" means nothing. Checked after the password comparison
            // so the response does not reveal which emails exist.
            if (user.status === 'Inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'This account has been deactivated. Please contact your administrator.'
                });
            }
            res.status(200).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                // Lets the header avatar render immediately without an extra
                // round-trip on every page.
                profilePhoto: user.profilePhoto || '',
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getUserProfile = async (req, res) => {
    try {
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
            user.countryCode = req.body.countryCode || user.countryCode;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            
            user.addressLine1 = req.body.addressLine1 || user.addressLine1;
            user.addressLine2 = req.body.addressLine2 || user.addressLine2;
            user.addressLine3 = req.body.addressLine3 || user.addressLine3;
            
            // [LEARNING NOTE]: Checking !== undefined allows us to save empty strings when user clicks "Remove Photo/CV"
            if (req.body.profilePhoto !== undefined) user.profilePhoto = req.body.profilePhoto;
            if (req.body.cvFileName !== undefined) user.cvFile = req.body.cvFileName;

            if (!user.emergencyContact) user.emergencyContact = {};
            user.emergencyContact.name = req.body.emergencyName || user.emergencyContact.name;
            user.emergencyContact.countryCode = req.body.emergencyCountryCode || user.emergencyContact.countryCode;
            user.emergencyContact.phone = req.body.emergencyPhone || user.emergencyContact.phone;
            user.emergencyContact.relation = req.body.emergencyRelation || user.emergencyContact.relation;

            if (!user.medicalDetails) user.medicalDetails = {};
            user.medicalDetails.bloodGroup = req.body.bloodGroup || user.medicalDetails.bloodGroup;
            user.medicalDetails.allergies = req.body.allergies || user.medicalDetails.allergies;

            if (req.body.skills) user.skills = req.body.skills;

            // [LEARNING NOTE]: Push an activity to the top of the array
            user.activities.unshift({
                action: 'Updated Profile Information',
                date: new Date()
            });

            const updatedUser = await user.save();
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