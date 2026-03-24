import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';

const useSocket = (userId) => {
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    socketRef.current = io(API_BASE_URL, {
      transports: ['websocket']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      logger.info('Connected to server:', socket.id);
      setSocketInstance(socket);
      // Join user to their chat rooms
      socket.emit('join-rooms', userId);
    });

    socket.on('disconnect', () => {
      logger.info('Disconnected from server');
      setSocketInstance(null);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocketInstance(null);
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
    socket: socketInstance,
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
