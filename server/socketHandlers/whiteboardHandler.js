// socketHandlers/whiteboardHandler.js
// Real-time collaborative whiteboard handler using Socket.io

module.exports = function whiteboardHandler(io) {
  // Store latest canvas state per whiteboard room in memory
  const whiteboardStates = new Map(); // roomId -> { json, updatedAt }

  io.on('connection', (socket) => {
    // Join a whiteboard room (typically the same as chat room ID)
    socket.on('whiteboard-join', ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') return;
      const wbRoom = `whiteboard_${roomId}`;
      socket.join(wbRoom);
      // Send latest state to the newly joined client
      const state = whiteboardStates.get(roomId);
      if (state?.json) {
        socket.emit('whiteboard-sync', { roomId, json: state.json });
      }
    });

    // Receive full-canvas updates (throttled on client) and broadcast
    socket.on('whiteboard-update', ({ roomId, json }) => {
      if (!roomId || typeof roomId !== 'string' || !json) return;
      whiteboardStates.set(roomId, { json, updatedAt: Date.now() });
      const wbRoom = `whiteboard_${roomId}`;
      socket.to(wbRoom).emit('whiteboard-sync', { roomId, json });
    });

    // Clear whiteboard
    socket.on('whiteboard-clear', ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') return;
      whiteboardStates.set(roomId, { json: null, updatedAt: Date.now() });
      const wbRoom = `whiteboard_${roomId}`;
      socket.to(wbRoom).emit('whiteboard-cleared', { roomId });
    });
  });

  return {
    getState: (roomId) => whiteboardStates.get(roomId) || null
  };
};