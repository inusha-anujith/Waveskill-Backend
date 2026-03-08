const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Attempt to connect to the database using the URI from .env
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit the process with a failure code if the connection drops
        process.exit(1);
    }
};

module.exports = connectDB;