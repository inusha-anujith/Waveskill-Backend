const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please add a name'] },
    email: { type: String, required: [true, 'Please add an email'], unique: true },
    password: { type: String, required: [true, 'Please add a password'] },
    role: { type: String, enum: ['Employee', 'Manager', 'Admin'], default: 'Employee' },
    
    // Profile Fields
    department: { type: String, default: 'Unassigned' },
    position: { type: String, default: 'Employee' },
    employeeId: { type: String },
    phoneNumber: { type: String },
    homeAddress: { type: String },
    joinDate: { type: Date, default: Date.now },
    totalAnnualLeave: { type: Number, default: 20 },
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String }
    },
    medicalDetails: {
        bloodGroup: { type: String },
        allergies: { type: String, default: 'None' }
    },
    skills: [{
        name: { type: String },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
        percentage: { type: Number }
    }]
}, { timestamps: true });

// --- THE MISSING FUNCTIONS WE NEED TO RESTORE ---

// 1. Hash the password before saving a new user
userSchema.pre('save', async function() {
    // If the password wasn't changed (like when we only update the phone number), just stop here!
    if (!this.isModified('password')) {
        return; 
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 2. Check if the entered password matches the database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// -------------------------------------------------

module.exports = mongoose.model('User', userSchema);