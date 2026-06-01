const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Project = require('../models/Projects');
const Customer = require('../models/customerModel');

// ----------------------------------------------------
// PROJECTS ROUTES
// ----------------------------------------------------

// 1. Get all projects and calculate statistics
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    const allCount = projects.length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
    const ongoingCount = projects.filter(p => p.status === 'ONGOING').length;
    const rejectedCount = projects.filter(p => p.status === 'REJECTED').length;

    res.status(200).json({
      stats: {
        all: allCount,
        completed: completedCount,
        ongoing: ongoingCount,
        rejected: rejectedCount
      },
      projects: projects
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 2. Create a new project with default customer ID for testing
router.post('/projects', async (req, res) => {
  try {
    const { name, status, progress, lead, deadline, currentFocus } = req.body;
    const newProject = new Project({
      name,
      status,
      progress,
      lead,
      deadline,
      currentFocus,
      customerId: '65f1a2b3c4d5e6f7a8b9c0d1'
    });
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
});


// ----------------------------------------------------
// CUSTOMER PROFILE ROUTES
// ----------------------------------------------------

// 1. Fetch profile data and seed default customer if database is empty
router.get('/profile', async (req, res) => {
  try {
    let customer = await Customer.findOne();
    
    if (!customer) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      customer = new Customer({
        firstName: "Kaushalya",
        lastName: "Client",
        email: "kaushalya@example.com",
        phone: "+94 77 123 4567",
        password: hashedPassword,
        companyName: "Apex Digital Studios",
        website: "https://apexstudios.com",
        address: "128 Galle Road, Colombo 03, Sri Lanka"
      });
      await customer.save();
    }
    
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 2. Update profile and company details
router.put('/profile/update', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, companyName, website, address } = req.body;
    
    const updatedCustomer = await Customer.findOneAndUpdate(
      {}, 
      { firstName, lastName, email, phone, companyName, website, address },
      { new: true }
    );

    res.status(200).json({ success: true, customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ message: "Update Error", error: error.message });
  }
});

// 3. Change customer password with validation
router.put('/profile/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const customer = await Customer.findOne();

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Password Error", error: error.message });
  }
});

module.exports = router;