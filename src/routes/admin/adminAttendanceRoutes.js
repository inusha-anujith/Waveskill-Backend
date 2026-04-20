const express = require('express');
const router = express.Router();

const { listAttendance } = require('../../controllers/admin/adminAttendanceController');

router.get('/', listAttendance);

module.exports = router;
