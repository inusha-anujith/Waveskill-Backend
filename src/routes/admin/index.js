const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../../middleware/auth');

const adminUserRoutes = require('./adminUserRoutes');
const adminLeaveRoutes = require('./adminLeaveRoutes');
const adminAttendanceRoutes = require('./adminAttendanceRoutes');
const adminAnalyticsRoutes = require('./adminAnalyticsRoutes');
const adminOTRoutes = require('./adminOTRoutes');
const adminCustomerRoutes = require('./adminCustomerRoutes');

// All /api/admin routes require authentication
router.use(protect);

// Admin+Manager: analytics, leaves, attendance, user list
router.use('/users', restrictTo('Admin', 'Manager'), adminUserRoutes);
router.use('/attendance', restrictTo('Admin', 'Manager'), adminAttendanceRoutes);
router.use('/leaves', restrictTo('Admin', 'Manager'), adminLeaveRoutes);
router.use('/analytics', restrictTo('Admin', 'Manager'), adminAnalyticsRoutes);

// OT: Manager only (controller double-checks internally)
router.use('/ot', restrictTo('Manager'), adminOTRoutes);

// Customers: Admin only — customer management is an Admin responsibility
router.use('/customers', restrictTo('Admin'), adminCustomerRoutes);

module.exports = router;
