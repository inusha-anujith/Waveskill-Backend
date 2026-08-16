require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');

const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Waveskill Admin';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@waveskill.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existing = await User.findOne({ role: 'Admin' });
        if (existing) {
            console.log(`Admin already exists: ${existing.email}`);
            process.exit(0);
        }

        const admin = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'Admin'
        });

        console.log('Default admin created:');
        console.log(`  email:    ${admin.email}`);
        console.log(`  password: ${ADMIN_PASSWORD}`);
        console.log('Change the password immediately after first login.');
        process.exit(0);
    } catch (error) {
        console.error(`Seed failed: ${error.message}`);
        process.exit(1);
    }
})();
