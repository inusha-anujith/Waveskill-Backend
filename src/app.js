const express = require('express');
const cors = require('cors');

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

module.exports = app;