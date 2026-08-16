const express = require('express');
const router = express.Router();

const { submitOT, getMyOTRequests } = require('../controllers/otController');
const { protect } = require('../middleware/auth');

router.post('/', protect, submitOT);
router.get('/me', protect, getMyOTRequests);

module.exports = router;
