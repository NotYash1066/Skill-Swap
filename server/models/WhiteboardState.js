const mongoose = require('mongoose');

const WhiteboardStateSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  canvasData: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WhiteboardState', WhiteboardStateSchema);
