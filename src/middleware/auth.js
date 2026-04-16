const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    // Check if the authorization header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format is "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the secret key in your .env file
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database using the ID inside the token
            // .select('-password') ensures we don't accidentally attach the password to the request
            req.user = await User.findById(decoded.id).select('-password');

            // Move on to the next piece of middleware or the actual controller
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
};

// Role guard. Use after `protect`. Example: restrictTo('Admin', 'Manager')
const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Forbidden: requires role ${roles.join(' or ')}`
        });
    }
    next();
};

module.exports = { protect, restrictTo };