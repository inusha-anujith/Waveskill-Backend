const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { AVATAR_UPLOAD_DIR } = require('./middleware/uploadMiddleware');

// All Route Imports (Your Customer routes + Team routes)
const employeeRoutes = require('./routes/employeeRoutes');
const customerRoutes = require('./routes/customerRoutes'); // Customer routes
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const projectRoutes = require('./routes/projectRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const profileRoutes = require('./routes/profileRoutes');
const otRoutes = require('./routes/otRoutes');
const adminRoutes = require('./routes/admin');

const app = express();

// Enable CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

// Middleware to parse JSON
app.use(express.json());

// Avatars are served without authentication because an <img> tag cannot send
// an Authorization header. Filenames are 128-bit random, so the URL itself is
// the access control. Long cache headers are safe: every upload gets a new
// filename, so a replaced photo can never be served stale.
// CVs are deliberately NOT exposed this way — they stay behind the
// authenticated /api/profile/cv and /api/admin/users/:id/cv routes.
app.use('/uploads/avatars', express.static(AVATAR_UPLOAD_DIR, {
    maxAge: '7d',
    immutable: true,
    fallthrough: true
}));

// Mounting All Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes); // Customer API Endpoint
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ot', otRoutes);
app.use('/api/admin', adminRoutes);

// Base route test
app.get('/', (req, res) => {
    res.send('Waveskill HR API is running...');
});

// Error handler. Without this, multer rejections (wrong file type, file too
// large) bubble up as an HTML stack trace, which the frontend cannot parse.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File is too large. Maximum size is 5MB.'
            : err.message;
        return res.status(400).json({ success: false, message });
    }

    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

module.exports = app;