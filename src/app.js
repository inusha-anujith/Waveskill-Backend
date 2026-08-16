const express = require('express');
const cors = require('cors'); // <-- 1. CORS is imported here

// All your route imports
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const projectRoutes = require('./routes/projectRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Middleware
app.use(cors()); // <-- 2. CORS is enabled here (The Bridge is open!)
app.use(express.json());

// Mounting all your routes
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/profile', profileRoutes);

// Base route test
app.get('/', (req, res) => {
    res.send('Waveskill HR API is running...');
});

module.exports = app;