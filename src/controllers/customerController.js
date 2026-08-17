const Customer = require('../models/CustomerModel');
const Project = require('../models/ProjectModel');
const jwt = require('jsonwebtoken');


exports.getCustomerProfile = async (req, res) => {
  try {
    
    const customerId = req.customer?.id || req.user?.id;

    const customer = await Customer.findById(customerId).select('-password');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    
    res.json(customer);
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 2. Get Customer Projects & Stats
exports.getCustomerProjects = async (req, res) => {
  try {
    const customerId = req.customer?.id || req.user?.id;

    const projects = await Project.find({ customerId: customerId }).sort({ createdAt: -1 });

    const statusOrder = { ONGOING: 1, COMPLETED: 2, REJECTED: 3 };
    projects.sort((a, b) => (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4));

    const stats = {
      all: projects.length,
      ongoing: projects.filter(p => p.status === 'ONGOING').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      rejected: projects.filter(p => p.status === 'REJECTED').length
    };

    res.json({ projects, stats });
  } catch (err) {
    console.error("Projects Fetch Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login Controller
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email });

    if (!customer || (customer.password && customer.password !== password)) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.requestUpdate = async (req, res) => {
  try {
    const { note } = req.body;
    res.status(200).json({ message: 'Update request submitted successfully', note });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};