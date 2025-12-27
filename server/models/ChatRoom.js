const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only 2 participants per chat room
ChatRoomSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Chat room must have exactly 2 participants'));
  } else {
    next();
  }
});

// Index for efficient queries
ChatRoomSchema.index({ participants: 1 });
ChatRoomSchema.index({ participants: 1, isActive: 1 });
ChatRoomSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
