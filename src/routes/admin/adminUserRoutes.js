const express = require('express');
const router = express.Router();

const {
    createUser,
    listUsers,
    getUserById,
    updateUser,
    deactivateUser,
    reactivateUser,
    getUserCV
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
    // DELETE now deactivates rather than destroying the record. Kept as an
    // alias so any existing caller keeps working.
    .delete(restrictTo('Admin'), deactivateUser);

router.patch('/:id/deactivate', restrictTo('Admin'), deactivateUser);
router.patch('/:id/reactivate', restrictTo('Admin'), reactivateUser);

// Serving the CV through an authenticated route (rather than express.static on
// the uploads folder) keeps CVs from being readable by anyone who guesses a URL.
router.get('/:id/cv', getUserCV);

module.exports = router;
