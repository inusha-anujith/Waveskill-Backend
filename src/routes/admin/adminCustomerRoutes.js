const express = require('express');
const router = express.Router();

const {
    listCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deactivateCustomer,
    reactivateCustomer
} = require('../../controllers/admin/adminCustomerController');

// Admin-only is enforced where this router is mounted (routes/admin/index.js).
router.route('/')
    .get(listCustomers)
    .post(createCustomer);

router.route('/:id')
    .get(getCustomerById)
    .patch(updateCustomer)
    // DELETE now deactivates rather than destroying the record. Kept as an
    // alias so any existing caller keeps working.
    .delete(deactivateCustomer);

router.patch('/:id/deactivate', deactivateCustomer);
router.patch('/:id/reactivate', reactivateCustomer);

module.exports = router;
