import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (userId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      // Join user to their chat rooms
      socket.emit('join-rooms', userId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  const sendMessage = (roomId, content, senderId) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        roomId,
        content,
        senderId
      });
    }
  };

  const startTyping = (roomId, userId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        roomId,
        userId,
        username: 'User' // You can get actual username from context
      });
    }
  };

  const stopTyping = (roomId, userId) => {
    if (socketRef.current) {
      socketRef.current.emit('stop-typing', {
        roomId,
        userId
      });
    }
  };

  const onNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new-message', callback);
    }
  };

  const onUserTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-typing', callback);
    }
  };

  const onUserStopTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-stop-typing', callback);
    }
  };

  const offNewMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('new-message');
    }
  };

  const offUserTyping = () => {
    if (socketRef.current) {
      socketRef.current.off('user-typing');
      socketRef.current.off('user-stop-typing');
    }
  };

  return {
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
    offNewMessage,
    offUserTyping
  };
};

export default useSocket;
