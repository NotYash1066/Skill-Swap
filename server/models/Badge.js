const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['verified', 'expert', 'mentor'], 
    required: true 
  },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sessionsCompleted: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  earnedAt: { type: Date, default: Date.now }
});

badgeSchema.index({ user: 1, skill: 1 });

module.exports = mongoose.model('Badge', badgeSchema);
