const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Customers live in their own collection, but carry a role so the frontend
    // can treat them uniformly with User accounts when routing after login.
    role: { type: String, default: 'Customer' },

    companyName: { type: String, default: '' },
    corporateWebsite: { type: String, default: '' },
    headquartersAddress: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: {
        type: String,
        enum: ['ACTIVE CLIENT', 'INACTIVE', 'PROSPECT', 'ARCHIVED'],
        default: 'ACTIVE CLIENT'
    },
    country: { type: String, default: 'Colombo, Sri Lanka' },

    // Admin-facing fields
    industry: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    notes: { type: String, default: '' }
}, { timestamps: true });

// Hashes the password before saving. Without this the seeders wrote plaintext
// passwords while loginCustomer compared them with bcrypt, so no seeded
// customer could ever log in.
customerSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Mirrors userModel.matchPassword so both login paths look the same.
customerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
