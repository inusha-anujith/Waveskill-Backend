const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['ONGOING', 'COMPLETED', 'REJECTED'], // 👈 මෙතන REJECTED කියලා නිවැරදි කළා
    default: 'ONGOING'
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  lead: { type: String, required: true },          // 👈 Project Manager ගේ නම
  deadline: { type: Date, required: true },          // 👈 Deadline එක
  currentFocus: { type: String, default: "" },       // 👈 Detail view එකේ පෙනෙන current focus status එක
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);