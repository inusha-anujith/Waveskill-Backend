const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const customerRoutes = require('./routes/customerRoutes'); // 1. Import Customer Routes

const app = express();

// Enable CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

// Middleware to parse JSON
app.use(express.json());

// Mount the routes
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes); 

// Base route
app.get('/', (req, res) => {
    res.send('Waveskill HR API is running...');
});

module.exports = app;