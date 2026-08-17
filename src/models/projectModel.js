const mongoose = require('mongoose');

// 1. Task Sub-Schema
const taskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['To Do', 'In Progress', 'Done'], 
        default: 'To Do' 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
});

// 2. Combined Project Schema
const projectSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    overview: { 
        type: String 
    },
    priority: { 
        type: String, 
        enum: ['high priority', 'normal priority', 'low priority'], 
        default: 'normal priority' 
    },
    startDate: { 
        type: Date, 
        default: Date.now 
    },
    deadline: { 
        type: Date 
    },
    dueDate: { 
        type: Date 
    },
    status: { 
        type: String, 
        enum: ['ONGOING', 'COMPLETED', 'REJECTED', 'PENDING', 'IN_REVIEW', 'Active', 'On Hold'], 
        default: 'Active' 
    },
    progress: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100 
    },
    team: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        role: { 
            type: String 
        }
    }],
    tasks: [taskSchema] 
}, { timestamps: true });

// Prevent OverwriteModelError by checking existing models first
module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);