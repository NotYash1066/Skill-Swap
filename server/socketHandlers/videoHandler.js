const videoHandler = (io) => {
  // Store active video rooms and their participants
  const videoRooms = new Map();
  const userSockets = new Map();

  const handleVideoConnection = (socket) => {
    console.log('Video handler attached for socket:', socket.id);

    // Store user socket mapping
    socket.on('register-user', (userId) => {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Handle video call initiation
    socket.on('initiate-video-call', async (data) => {
      try {
        const { targetUserId, callerId, callerName } = data;
        const targetSocketId = userSockets.get(targetUserId);
        
        if (targetSocketId) {
          console.log(`Initiating video call from ${callerId} to ${targetUserId}`);
          
          // Create a unique room ID for this call
          const roomId = `video_${callerId}_${targetUserId}_${Date.now()}`;
          
          // Send call invitation to target user
          io.to(targetSocketId).emit('incoming-video-call', {
            callerId,
            callerName,
            roomId
          });

          // Send confirmation to caller
          socket.emit('call-initiated', { roomId, targetUserId });
        } else {
          socket.emit('call-error', { message: 'User is not online' });
        }
      } catch (error) {
        console.error('Error initiating video call:', error);
        socket.emit('call-error', { message: 'Failed to initiate call' });
      }
    });

    // Handle call acceptance
    socket.on('accept-video-call', (data) => {
      try {
        const { roomId, callerId } = data;
        const callerSocketId = userSockets.get(callerId);
        
        if (callerSocketId) {
          console.log(`Video call accepted for room: ${roomId}`);
          
          // Initialize room data
          videoRooms.set(roomId, {
            participants: [callerId, socket.userId],
            createdAt: new Date(),
            active: true
          });

          // Notify both users that call is accepted
          io.to(callerSocketId).emit('call-accepted', { roomId });
          socket.emit('call-accepted', { roomId });
        }
      } catch (error) {
        console.error('Error accepting video call:', error);
        socket.emit('call-error', { message: 'Failed to accept call' });
      }
    });

    // Handle call rejection
    socket.on('reject-video-call', (data) => {
      try {
        const { roomId, callerId, reason = 'declined' } = data;
        const callerSocketId = userSockets.get(callerId);
        
        if (callerSocketId) {
          console.log(`Video call rejected for room: ${roomId}`);
          io.to(callerSocketId).emit('call-rejected', { roomId, reason });
        }
      } catch (error) {
        console.error('Error rejecting video call:', error);
      }
    });

    // Handle joining video room
    socket.on('join-video-room', (data) => {
      try {
        const { roomId } = data;
        socket.join(roomId);
        
        const room = videoRooms.get(roomId);
        if (room) {
          console.log(`User ${socket.userId} joined video room: ${roomId}`);
          
          // Notify other participants
          socket.to(roomId).emit('user-joined-video', {
            userId: socket.userId,
            socketId: socket.id
          });

          socket.emit('joined-video-room', { roomId });
        }
      } catch (error) {
        console.error('Error joining video room:', error);
        socket.emit('call-error', { message: 'Failed to join video room' });
      }
    });

    // Handle WebRTC signaling
    socket.on('video-offer', (data) => {
      const { roomId, offer, targetSocketId } = data;
      console.log(`Video offer sent in room: ${roomId}`);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('video-offer', {
          offer,
          senderSocketId: socket.id,
          roomId
        });
      } else {
        // Broadcast to all other users in the room
        socket.to(roomId).emit('video-offer', {
          offer,
          senderSocketId: socket.id,
          roomId
        });
      }
    });

    socket.on('video-answer', (data) => {
      const { roomId, answer, targetSocketId } = data;
      console.log(`Video answer sent in room: ${roomId}`);
      
      io.to(targetSocketId).emit('video-answer', {
        answer,
        senderSocketId: socket.id,
        roomId
      });
    });

    socket.on('ice-candidate', (data) => {
      const { roomId, candidate, targetSocketId } = data;
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice-candidate', {
          candidate,
          senderSocketId: socket.id,
          roomId
        });
      } else {
        socket.to(roomId).emit('ice-candidate', {
          candidate,
          senderSocketId: socket.id,
          roomId
        });
      }
    });

    // Handle screen sharing
    socket.on('start-screen-share', (data) => {
      const { roomId } = data;
      console.log(`Screen sharing started in room: ${roomId}`);
      socket.to(roomId).emit('screen-share-started', {
        userId: socket.userId,
        socketId: socket.id
      });
    });

    socket.on('stop-screen-share', (data) => {
      const { roomId } = data;
      console.log(`Screen sharing stopped in room: ${roomId}`);
      socket.to(roomId).emit('screen-share-stopped', {
        userId: socket.userId
      });
    });

    // Handle call end
    socket.on('end-video-call', (data) => {
      try {
        const { roomId } = data;
        console.log(`Video call ended in room: ${roomId}`);
        
        // Notify all participants
        socket.to(roomId).emit('call-ended', {
          endedBy: socket.userId,
          roomId
        });

        // Clean up room data
        const room = videoRooms.get(roomId);
        if (room) {
          room.active = false;
          room.endedAt = new Date();
        }
      } catch (error) {
        console.error('Error ending video call:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from video handler`);
      
      // Remove from user sockets mapping
      if (socket.userId) {
        userSockets.delete(socket.userId);
      }

      // Handle any active video calls
      for (const [roomId, room] of videoRooms.entries()) {
        if (room.active && room.participants.includes(socket.userId)) {
          console.log(`User ${socket.userId} disconnected from active video room: ${roomId}`);
          
          // Notify other participants
          socket.to(roomId).emit('participant-disconnected', {
            userId: socket.userId,
            roomId
          });

          // If only one participant left, end the call
          const activeParticipants = room.participants.length - 1;
          if (activeParticipants <= 1) {
            room.active = false;
            room.endedAt = new Date();
            socket.to(roomId).emit('call-ended', {
              reason: 'participant_disconnected',
              roomId
            });
          }
        }
      }
    });
  };

  // Attach video handlers to each socket connection
  io.on('connection', handleVideoConnection);

  return {
    getActiveRooms: () => Array.from(videoRooms.entries()),
    getOnlineUsers: () => Array.from(userSockets.keys()),
    getRoomParticipants: (roomId) => {
      const room = videoRooms.get(roomId);
      return room ? room.participants : [];
    }
  };
};

module.exports = videoHandler;