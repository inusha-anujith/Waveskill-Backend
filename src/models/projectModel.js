const mongoose = require('mongoose');

// 1. First, we define what a single "Task" looks like
const taskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    // Matches the exact text on the right side of your task list UI
    status: { 
        type: String, 
        enum: ['To Do', 'In Progress', 'Done'], 
        default: 'To Do' 
    },
    // This lets us assign specific tasks to specific employees
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
});

// 2. Next, we define the main "Project" which holds those tasks
const projectSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    overview: { 
        type: String 
    },
    // Matches your red and grey pill badges
    priority: { 
        type: String, 
        enum: ['high priority', 'normal priority', 'low priority'], 
        default: 'normal priority' 
    },
    dueDate: { 
        type: Date 
    },
    // Matches the dropdown menu in your "Project Status" box
    status: { 
        type: String, 
        enum: ['Active', 'On Hold', 'Completed'], 
        default: 'Active' 
    },
    // This holds the exact percentage from your slider (0 to 100)
    progress: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100 
    },
    // "My Team" box: A list of users and their specific roles on this project
    team: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        role: { 
            type: String 
        } // e.g., "Frontend Developer", "Project Manager"
    }],
    // We embed the tasks we defined at the top right here!
    tasks: [taskSchema] 
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);