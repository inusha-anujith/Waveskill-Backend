require('dotenv').config();
const cors = require('cors');
const app = require('./src/app');
const connectDB = require('./src/config/db');

// 1. Enable CORS (Allow requests from the frontend)
// This must be placed before defining the routes!
app.use(cors());

// 2. Connect Customer Routes
const customerRoutes = require('./src/routes/customerRoutes');
app.use('/api/customer', customerRoutes);

// 3. Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g., if the database goes down)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});