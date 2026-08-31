require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../src/models/customerModel');

// NOTE: this replaces the root-level seedData.js for customers. That script
// hardcoded mongodb://127.0.0.1:27017 (the project moved to Atlas) and called
// deleteMany({}) on every Customer and Project. This one is idempotent and
// uses Customer.create() so the model's pre-save bcrypt hook actually runs —
// seedData.js stored plaintext passwords that could never pass login.
const DEMO_CUSTOMERS = [
    {
        firstName: 'Kaushalya',
        lastName: 'Perera',
        email: 'kaushalya@waveskill.com',
        password: 'Customer@123',
        companyName: 'Waveskill Solutions Ltd',
        corporateWebsite: 'https://waveskill.dev',
        headquartersAddress: 'No. 45, Galle Road, Colombo 03',
        phone: '+94 77 123 4567',
        country: 'Colombo, Sri Lanka',
        industry: 'Software Services',
        contactPerson: 'Kaushalya Perera',
        status: 'ACTIVE CLIENT',
    },
    {
        firstName: 'Frank',
        lastName: 'Castle',
        email: 'frank@castleindustries.com',
        password: 'Customer@123',
        companyName: 'Castle Industries Inc',
        corporateWebsite: 'https://castleindustries.com',
        headquartersAddress: '540 West 49th Street, New York, NY 10019',
        phone: '+1 212 555 0199',
        country: 'New York, USA',
        industry: 'Manufacturing',
        contactPerson: 'Frank Castle',
        status: 'ACTIVE CLIENT',
    },
    {
        firstName: 'Amara',
        lastName: 'Silva',
        email: 'amara@nexoretail.lk',
        password: 'Customer@123',
        companyName: 'Nexo Retail (Pvt) Ltd',
        corporateWebsite: 'https://nexoretail.lk',
        headquartersAddress: 'No. 12, Duplication Road, Colombo 04',
        phone: '+94 76 884 2210',
        country: 'Colombo, Sri Lanka',
        industry: 'Retail & E-Commerce',
        contactPerson: 'Amara Silva',
        status: 'ACTIVE CLIENT',
    },
    {
        firstName: 'Daniel',
        lastName: 'Okafor',
        email: 'daniel@meridianhealth.com',
        password: 'Customer@123',
        companyName: 'Meridian Health Group',
        corporateWebsite: 'https://meridianhealth.com',
        headquartersAddress: '88 Marina Boulevard, Singapore 018981',
        phone: '+65 6812 4400',
        country: 'Singapore',
        industry: 'Healthcare',
        contactPerson: 'Daniel Okafor',
        status: 'PROSPECT',
        notes: 'Evaluating a patient records portal. Follow up next quarter.',
    },
    {
        firstName: 'Priya',
        lastName: 'Raman',
        email: 'priya@lumenfinance.in',
        password: 'Customer@123',
        companyName: 'Lumen Finance Pvt Ltd',
        corporateWebsite: 'https://lumenfinance.in',
        headquartersAddress: 'Tower B, Cyber City, Gurugram 122002',
        phone: '+91 98110 55221',
        country: 'Gurugram, India',
        industry: 'Financial Services',
        contactPerson: 'Priya Raman',
        status: 'INACTIVE',
        notes: 'Contract ended March 2026. Open to renewal discussions.',
    },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        let created = 0;
        let skipped = 0;

        for (const c of DEMO_CUSTOMERS) {
            const exists = await Customer.findOne({ email: c.email });
            if (exists) {
                skipped++;
                continue;
            }
            await Customer.create(c);
            created++;
        }

        console.log(`Customers seeded: ${created} created, ${skipped} already existed`);
        console.log('Default password for demo customers: Customer@123');
        process.exit(0);
    } catch (e) {
        console.error(`Seed customers failed: ${e.message}`);
        process.exit(1);
    }
})();
