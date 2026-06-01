const express = require('express');
const router = express.Router();
const Project = require('../models/Projects');

// 📊 1. සියලුම Projects සහ Stats ලබාගන්නා GET Route එක
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    // Stats ගණන් හදමු
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

// ➕ 2. ටෙස්ට් කරන්න අලුත් Fields එක්ක දත්ත දාන POST Route එක
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

module.exports = router;