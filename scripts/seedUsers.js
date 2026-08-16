require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');

const DEMO_USERS = [
    {
        name: 'Sarah Manager',
        email: 'manager@waveskill.com',
        password: 'Manager@123',
        role: 'Manager',
        department: 'Engineering',
        position: 'Engineering Manager',
        employeeId: 'EMP-000002',
        phoneNumber: '+94 77 111 1111',
    },
    {
        name: 'John Doe',
        email: 'john@waveskill.com',
        password: 'Demo@1234',
        role: 'Employee',
        department: 'Engineering',
        position: 'Software Engineer',
        employeeId: 'EMP-000003',
        phoneNumber: '+94 77 222 2222',
    },
    {
        name: 'Jane Smith',
        email: 'jane@waveskill.com',
        password: 'Demo@1234',
        role: 'Employee',
        department: 'Marketing',
        position: 'Marketing Specialist',
        employeeId: 'EMP-000004',
        phoneNumber: '+94 77 333 3333',
    },
    {
        name: 'Mike Johnson',
        email: 'mike@waveskill.com',
        password: 'Demo@1234',
        role: 'Employee',
        department: 'Engineering',
        position: 'QA Engineer',
        employeeId: 'EMP-000005',
        phoneNumber: '+94 77 444 4444',
    },
    {
        name: 'Lisa Chen',
        email: 'lisa@waveskill.com',
        password: 'Demo@1234',
        role: 'Employee',
        department: 'Human Resources',
        position: 'HR Coordinator',
        employeeId: 'EMP-000006',
        phoneNumber: '+94 77 555 5555',
    },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let created = 0;
        let skipped = 0;
        for (const u of DEMO_USERS) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                skipped++;
                continue;
            }
            await User.create(u);
            created++;
        }
        console.log(`Users seeded: ${created} created, ${skipped} already existed`);
        console.log('Default password for demo employees: Demo@1234');
        console.log('Manager password: Manager@123');
        process.exit(0);
    } catch (e) {
        console.error(`Seed users failed: ${e.message}`);
        process.exit(1);
    }
})();
