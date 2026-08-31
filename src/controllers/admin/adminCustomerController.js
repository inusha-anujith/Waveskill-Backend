const Customer = require('../../models/customerModel');
const Project = require('../../models/projectModel');

// Fields an Admin may set when creating or updating a customer. Anything else
// in the request body (role, _id, timestamps) is ignored on purpose.
const EDITABLE_FIELDS = [
    'firstName', 'lastName', 'email', 'companyName', 'corporateWebsite',
    'headquartersAddress', 'phone', 'status', 'country',
    'industry', 'contactPerson', 'notes'
];

const sanitize = (customer) => {
    const obj = customer.toObject ? customer.toObject() : { ...customer };
    delete obj.password;
    return obj;
};

// @desc    List all customers (filterable by status / search)
// @route   GET /api/admin/customers
const listCustomers = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query).select('-password').sort({ createdAt: -1 });

        // Attach each customer's project count in one grouped query rather than
        // running a countDocuments per row.
        const counts = await Project.aggregate([
            { $match: { customerId: { $in: customers.map(c => c._id) } } },
            { $group: { _id: '$customerId', count: { $sum: 1 } } }
        ]);
        const countByCustomer = new Map(counts.map(c => [String(c._id), c.count]));

        const data = customers.map(c => ({
            ...c.toObject(),
            projectCount: countByCustomer.get(String(c._id)) || 0
        }));

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single customer with their projects
// @route   GET /api/admin/customers/:id
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).select('-password');
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        const projects = await Project.find({ customerId: customer._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { ...customer.toObject(), projects, projectCount: projects.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin creates a new customer
// @route   POST /api/admin/customers
const createCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'firstName, lastName, email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const normalisedEmail = email.toLowerCase().trim();

        const exists = await Customer.findOne({ email: normalisedEmail });
        if (exists) {
            return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
        }

        const payload = { password };
        EDITABLE_FIELDS.forEach((key) => {
            if (req.body[key] !== undefined) payload[key] = req.body[key];
        });
        payload.email = normalisedEmail;

        // create() (not insertMany) so the model's pre-save hashing hook runs.
        const customer = await Customer.create(payload);

        res.status(201).json({ success: true, data: sanitize(customer) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a customer
// @route   PATCH /api/admin/customers/:id
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        if (req.body.email && req.body.email.toLowerCase().trim() !== customer.email) {
            const taken = await Customer.findOne({ email: req.body.email.toLowerCase().trim() });
            if (taken) {
                return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
            }
        }

        EDITABLE_FIELDS.forEach((key) => {
            if (req.body[key] !== undefined) customer[key] = req.body[key];
        });

        // Optional password reset. Assigning here means the pre-save hook hashes it.
        if (req.body.password) {
            if (req.body.password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            }
            customer.password = req.body.password;
        }

        const saved = await customer.save();
        res.status(200).json({ success: true, data: sanitize(saved) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Deactivate a customer (soft delete — the record is retained so that
//          their projects keep resolving)
// @route   PATCH /api/admin/customers/:id/deactivate  (DELETE is kept as an alias)
const deactivateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        if (['INACTIVE', 'ARCHIVED'].includes(customer.status)) {
            return res.status(400).json({ success: false, message: 'This customer is already inactive' });
        }

        // No project guard is needed any more: the record is kept, so nothing
        // is orphaned by deactivating.
        customer.status = 'INACTIVE';
        await customer.save();

        res.status(200).json({ success: true, message: 'Customer deactivated', data: sanitize(customer) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Restore a previously deactivated customer
// @route   PATCH /api/admin/customers/:id/reactivate
const reactivateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

        if (!['INACTIVE', 'ARCHIVED'].includes(customer.status)) {
            return res.status(400).json({ success: false, message: 'This customer is already active' });
        }

        customer.status = 'ACTIVE CLIENT';
        await customer.save();

        res.status(200).json({ success: true, message: 'Customer reactivated', data: sanitize(customer) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    listCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deactivateCustomer,
    reactivateCustomer
};
