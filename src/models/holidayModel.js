const mongoose = require('mongoose');

// @desc Schema to store public and mercantile holidays
const holidaySchema = new mongoose.Schema({
    dateString: { 
        type: String, 
        required: true, 
        unique: true // Format: YYYY-MM-DD
    },
    name: { 
        type: String, 
        required: true // e.g., "Vesak Full Moon Poya Day"
    }
});

module.exports = mongoose.model('Holiday', holidaySchema);