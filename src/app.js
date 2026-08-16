const express = require('express');
const employeeRoutes = require('./routes/employeeRoutes');
// You can import userRoutes here later: const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware to parse incoming JSON payloads (from your frontend)
app.use(express.json());

// Mount the routes
// Any request starting with /api/employees will be handled by employeeRoutes
app.use('/api/employees', employeeRoutes);

// You can mount user routes here later: app.use('/api/users', userRoutes);

// A simple base route to verify the API is running
app.get('/', (req, res) => {
    res.send('Waveskill HR API is running...');
});

module.exports = app;