const express = require('express');
const router = express.Router();

const { getSummary } = require('../../controllers/admin/adminAnalyticsController');

router.get('/summary', getSummary);

module.exports = router;
