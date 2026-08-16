const express = require('express');
const router = express.Router();

const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

const { protect, restrictTo } = require('../middleware/auth');

// GET is open to all authenticated users; mutations are Admin-only
router.route('/')
    .get(protect, getAllEmployees)
    .post(protect, restrictTo('Admin'), createEmployee);

router.route('/:id')
    .get(protect, getEmployeeById)
    .put(protect, restrictTo('Admin'), updateEmployee)
    .delete(protect, restrictTo('Admin'), deleteEmployee);

module.exports = router;
