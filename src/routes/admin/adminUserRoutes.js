const express = require('express');
const router = express.Router();

const {
    createUser,
    listUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../../controllers/admin/adminUserController');

const { restrictTo } = require('../../middleware/auth');

// Reads (list + detail) are open to Admin and Manager (gated at /api/admin level).
// Writes (create / update / delete) are Admin only — per Dasuni.pdf "User Management (Admin Only)".
router.route('/')
    .get(listUsers)
    .post(restrictTo('Admin'), createUser);

router.route('/:id')
    .get(getUserById)
    .patch(restrictTo('Admin'), updateUser)
    .delete(restrictTo('Admin'), deleteUser);

module.exports = router;
