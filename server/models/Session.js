const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['teacher', 'learner'], required: true }
  }],
  skill: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  meetingLink: String,
  notes: String,
  reminder: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

sessionSchema.index({ 'participants.user': 1, scheduledAt: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
