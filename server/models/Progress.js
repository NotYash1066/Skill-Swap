const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  milestones: [{
    title: String,
    description: String,
    completedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  sessionsCompleted: { type: Number, default: 0 },
  hoursLearned: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  achievements: [{
    name: String,
    icon: String,
    unlockedAt: Date
  }]
});

progressSchema.index({ user: 1, skill: 1 });

module.exports = mongoose.model('Progress', progressSchema);
