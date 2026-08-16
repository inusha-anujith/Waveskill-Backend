const mongoose = require('mongoose');
const Customer = require('./src/models/CustomerModel');
const Project = require('./src/models/ProjectModel');

const MONGO_URI = 'mongodb://127.0.0.1:27017/software_company_db';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to MongoDB Database...');

  // 1. Clear old data
  await Customer.deleteMany({});
  await Project.deleteMany({});

  // 2. Kaushalya (3 Projects, Full Profile with exact schema keys)
  const user1 = await Customer.create({
    firstName: 'Kaushalya',
    lastName: 'Developer',
    email: 'kaushalya@gmail.com',
    password: 'kaushalya123',
    phone: '+94 77 123 4567',
    companyName: 'Waveskill Solutions Ltd',
    corporateWebsite: 'https://waveskill.dev',
    headquartersAddress: 'No. 45, Galle Road, Colombo 03',
    country: 'Colombo, Sri Lanka',
    status: 'ACTIVE CLIENT'
  });

  // 3. Frank (5 Projects, Full Profile with exact schema keys)
  const user2 = await Customer.create({
    firstName: 'Frank',
    lastName: 'Castle',
    email: 'frank@gmail.com',
    password: 'frank222',
    phone: '+1 212 555 0199',
    companyName: 'Castle Industries Inc',
    corporateWebsite: 'https://castleindustries.com',
    headquartersAddress: '540 West 49th Street, New York, NY 10019',
    country: 'New York, USA',
    status: 'ACTIVE CLIENT'
  });

  // 4. Kaushalya Projects (3 items)
  await Project.insertMany([
    {
      customerId: user1._id,
      title: 'E-Commerce Mobile App',
      description: 'Cross-platform mobile application with real-time payment processing.',
      status: 'ONGOING',
      progress: 65
    },
    {
      customerId: user1._id,
      title: 'Corporate Website Redesign',
      description: 'Modern responsive web architecture with Next.js & Tailwind CSS.',
      status: 'COMPLETED',
      progress: 100
    },
    {
      customerId: user1._id,
      title: 'UI/UX Design System',
      description: 'High-contrast dark luxury component library.',
      status: 'IN_REVIEW',
      progress: 80
    }
  ]);

  // 5. Frank Projects (5 items)
  await Project.insertMany([
    {
      customerId: user2._id,
      title: 'AI Support Chatbot Integration',
      description: 'Integrating LLM engine for automated enterprise customer care.',
      status: 'ONGOING',
      progress: 40
    },
    {
      customerId: user2._id,
      title: 'POS Desktop Management App',
      description: 'Offline-first retail & inventory system.',
      status: 'COMPLETED',
      progress: 100
    },
    {
      customerId: user2._id,
      title: 'Legacy Server Migration',
      description: 'Migrating legacy infrastructure to AWS microservices.',
      status: 'REJECTED',
      progress: 15
    },
    {
      customerId: user2._id,
      title: 'Stripe & PayPal API Gateway',
      description: 'Multi-currency checkout integration system.',
      status: 'PENDING',
      progress: 0
    },
    {
      customerId: user2._id,
      title: 'Cybersecurity Infrastructure Audit',
      description: 'Full system penetration testing & vulnerability patch review.',
      status: 'IN_REVIEW',
      progress: 85
    }
  ]);

  console.log('SUCCESS: Seeded Kaushalya (3 Projects) & Frank (5 Projects) with exact Customer Model keys!');
  process.exit();
}).catch(err => {
  console.error('Database connection error:', err.message);
  process.exit(1);
});