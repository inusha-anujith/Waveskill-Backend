const express = require('express');
const router = express.Router();

const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

// Import your new security middleware
const { protect } = require('../middleware/auth');

// Add "protect" right before the controller function on any route you want to secure
router.route('/')
    .get(protect, getAllEmployees)
    .post(protect, createEmployee);

router.route('/:id')
    .get(protect, getEmployeeById)
    .put(protect, updateEmployee)
    .delete(protect, deleteEmployee);

module.exports = router;