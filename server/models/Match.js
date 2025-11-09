const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  matchedSkills: [{
    type: String,
    required: true
  }],
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Prevent duplicate match requests
MatchSchema.index({ requester: 1, recipient: 1 }, { unique: true });
MatchSchema.index({ recipient: 1, status: 1 });
MatchSchema.index({ requester: 1, status: 1 });
MatchSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Match', MatchSchema);
