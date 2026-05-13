const express = require('express');
const router = express.Router();

const { listOTRequests, approveOT, rejectOT } = require('../../controllers/admin/adminOTController');

router.get('/', listOTRequests);
router.patch('/:id/approve', approveOT);
router.patch('/:id/reject', rejectOT);

module.exports = router;
