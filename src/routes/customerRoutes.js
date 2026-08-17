const express = require('express');
const router = express.Router();

const { 
  loginCustomer, 
  getCustomerProfile, 
  getCustomerProjects, 
  requestUpdate 
} = require('../controllers/customerController');

const { verifyToken } = require('../middleware/auth');

router.post('/login', loginCustomer);

router.get('/profile', verifyToken, getCustomerProfile);
router.get('/projects', verifyToken, getCustomerProjects);
router.post('/update-request', verifyToken, requestUpdate);

module.exports = router;