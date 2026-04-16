const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../../middleware/auth');

const adminUserRoutes = require('./adminUserRoutes');
const adminLeaveRoutes = require('./adminLeaveRoutes');
const adminAttendanceRoutes = require('./adminAttendanceRoutes');
const adminAnalyticsRoutes = require('./adminAnalyticsRoutes');

// Everything under /api/admin requires a logged-in user
router.use(protect);

// Read-side: both Admin and Manager (analytics, leaves list/approve/reject,
// attendance reports, user list). Write-side restrictions on /users live in
// adminUserRoutes (POST/PATCH/DELETE require Admin).
router.use('/users', restrictTo('Admin', 'Manager'), adminUserRoutes);
router.use('/attendance', restrictTo('Admin', 'Manager'), adminAttendanceRoutes);
router.use('/leaves', restrictTo('Admin', 'Manager'), adminLeaveRoutes);
router.use('/analytics', restrictTo('Admin', 'Manager'), adminAnalyticsRoutes);

module.exports = router;
