const express = require('express');
const router = express.Router();

const {
    createUser,
    listUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../../controllers/admin/adminUserController');

router.route('/')
    .get(listUsers)
    .post(createUser);

router.route('/:id')
    .get(getUserById)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;
