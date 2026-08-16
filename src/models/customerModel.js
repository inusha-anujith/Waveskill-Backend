const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyName: { type: String, default: '' },
    corporateWebsite: { type: String, default: '' },
    headquartersAddress: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, default: 'ACTIVE CLIENT' },
    country: { type: String, default: 'Colombo, Sri Lanka' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);