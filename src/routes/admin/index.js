const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../../middleware/auth');

const adminUserRoutes = require('./adminUserRoutes');
const adminLeaveRoutes = require('./adminLeaveRoutes');
const adminAttendanceRoutes = require('./adminAttendanceRoutes');
const adminAnalyticsRoutes = require('./adminAnalyticsRoutes');

// Everything under /api/admin requires a logged-in user
router.use(protect);

// User management & attendance reports are Admin only
router.use('/users', restrictTo('Admin'), adminUserRoutes);
router.use('/attendance', restrictTo('Admin'), adminAttendanceRoutes);

// Leave approval & dashboard analytics are open to both Admin and Manager
router.use('/leaves', restrictTo('Admin', 'Manager'), adminLeaveRoutes);
router.use('/analytics', restrictTo('Admin', 'Manager'), adminAnalyticsRoutes);

module.exports = router;
