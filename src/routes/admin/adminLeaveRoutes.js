const express = require('express');
const router = express.Router();

const {
    listLeaves,
    approveLeave,
    rejectLeave
} = require('../../controllers/admin/adminLeaveController');

router.get('/', listLeaves);
router.patch('/:id/approve', approveLeave);
router.patch('/:id/reject', rejectLeave);

module.exports = router;
