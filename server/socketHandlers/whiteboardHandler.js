// socketHandlers/whiteboardHandler.js
// Real-time collaborative whiteboard handler using Socket.io

const WhiteboardState = require('../models/WhiteboardState');

module.exports = function whiteboardHandler(io) {
  // Store latest canvas state per whiteboard room in memory
  const whiteboardStates = new Map(); // roomId -> { json, updatedAt }

  io.on('connection', (socket) => {
    // Join a whiteboard room (typically the same as chat room ID)
    socket.on('whiteboard-join', async ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') return;
      const wbRoom = `whiteboard_${roomId}`;
      socket.join(wbRoom);
      
      // Try to load from database first
      try {
        const savedState = await WhiteboardState.findOne({ roomId });
        if (savedState) {
          socket.emit('whiteboard-sync', { roomId, json: savedState.canvasData });
          whiteboardStates.set(roomId, { json: savedState.canvasData, updatedAt: Date.now() });
        } else {
          // Send latest state from memory
          const state = whiteboardStates.get(roomId);
          if (state?.json) {
            socket.emit('whiteboard-sync', { roomId, json: state.json });
          }
        }
      } catch (err) {
        console.error('Error loading whiteboard state:', err);
      }
    });

    // Receive full-canvas updates (throttled on client) and broadcast
    socket.on('whiteboard-update', async ({ roomId, json }) => {
      if (!roomId || typeof roomId !== 'string' || !json) return;
      whiteboardStates.set(roomId, { json, updatedAt: Date.now() });
      const wbRoom = `whiteboard_${roomId}`;
      socket.to(wbRoom).emit('whiteboard-sync', { roomId, json });
      
      // Save to database (debounced)
      try {
        await WhiteboardState.findOneAndUpdate(
          { roomId },
          { canvasData: json, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Error saving whiteboard state:', err);
      }
    });

    // Clear whiteboard
    socket.on('whiteboard-clear', async ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') return;
      whiteboardStates.set(roomId, { json: null, updatedAt: Date.now() });
      const wbRoom = `whiteboard_${roomId}`;
      socket.to(wbRoom).emit('whiteboard-cleared', { roomId });
      
      // Delete from database
      try {
        await WhiteboardState.deleteOne({ roomId });
      } catch (err) {
        console.error('Error clearing whiteboard state:', err);
      }
    });
  });

  return {
    getState: (roomId) => whiteboardStates.get(roomId) || null
  };
};