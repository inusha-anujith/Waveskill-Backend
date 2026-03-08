const express = require('express');
const router = express.Router();

// Import the controller functions
const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

// Optional: Import your auth middleware here when you're ready to secure these routes
// const { protect } = require('../middleware/auth');

// Map routes to controller functions
// For example: router.route('/').post(protect, createEmployee).get(protect, getAllEmployees);

router.route('/')
    .get(getAllEmployees)
    .post(createEmployee);

router.route('/:id')
    .get(getEmployeeById)
    .put(updateEmployee)
    .delete(deleteEmployee);

module.exports = router;