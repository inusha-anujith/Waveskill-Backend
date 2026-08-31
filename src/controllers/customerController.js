const Customer = require('../models/customerModel');
const Project = require('../models/projectModel');
const jwt = require('jsonwebtoken');

// ==========================================
// 1. Get Customer Profile
// ==========================================
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

// ==========================================
// 2. Get Customer Projects & Stats
// ==========================================
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

// ==========================================
// 3. Login Customer
// ==========================================
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Step 1: Find the customer by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Step 2: Compare the typed password against the stored bcrypt hash
    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Deactivated / archived clients keep their record but lose portal access.
    if (['INACTIVE', 'ARCHIVED'].includes(customer.status)) {
        return res.status(403).json({
            message: 'This account has been deactivated. Please contact your account manager.'
        });
    }

    // Step 3: Generate the JWT Token for the frontend
    const token = jwt.sign(
      { id: customer._id, role: 'Customer' },
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
        email: customer.email,
        role: customer.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================================
// 4. Request Update
// ==========================================
exports.requestUpdate = async (req, res) => {
  try {
    const { note } = req.body;
    res.status(200).json({ message: 'Update request submitted successfully', note });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};