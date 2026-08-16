require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to MongoDB
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