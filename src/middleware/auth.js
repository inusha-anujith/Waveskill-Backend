const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// 1. Customer Authentication Middleware (Your Code)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        req.customer = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// 2. System User Authentication Middleware (Develop Branch Code)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user no longer exists' });
            }

            // Tokens outlive the deactivation, so revoke here too — otherwise a
            // user deactivated mid-session keeps full access until expiry.
            if (user.status === 'Inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'This account has been deactivated. Please contact your administrator.'
                });
            }

            req.user = user;
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
};

// 3. Role Guard Middleware (Develop Branch Code)
const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Forbidden: requires role ${roles.join(' or ')}`
        });
    }
    next();
};

// Export all middlewares
module.exports = { 
    verifyToken, 
    protect, 
    restrictTo 
};