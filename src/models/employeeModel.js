const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: [true, 'Employee ID is required'],
            unique: true,
            trim: true
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
        },
        nic: {
            type: String,
            required: [true, 'NIC number is required'],
            unique: true,
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required']
        },
        department: {
            type: String,
            required: [true, 'Department is required']
        },
        designation: {
            type: String,
            required: [true, 'Designation is required']
        },
        salary: {
            type: Number,
            required: [true, 'Salary is required'],
            min: [0, 'Salary cannot be negative']
        },
        status: {
            type: String,
            enum: ['Active', 'On Leave', 'Inactive', 'Terminated'],
            default: 'Active'
        },
        dateOfJoining: {
            type: Date,
            default: Date.now
        }
    },
    {
        // Automatically adds 'createdAt' and 'updatedAt' fields
        timestamps: true 
    }
);

// Create and export the model
module.exports = mongoose.model('Employee', employeeSchema);