import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import useVideoCall from '../hooks/useVideoCall';

const VideoCallContext = createContext(null);

const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) return JSON.parse(storedUser);
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.user.id, username: payload.user.username || payload.user.name || 'User' };
  } catch {
    return null;
  }
};

export const VideoCallProvider = ({ children }) => {
  // Initialize current user on mount (lazy)
  const [currentUser] = useState(() => getCurrentUser());
  const managerRef = useRef(null);

  // Initialize dedicated socket for video calling
  // We use useMemo to create it only once when currentUser changes
  const socket = useMemo(() => {
    if (!currentUser) return null;
    return io(API_BASE_URL, { transports: ['websocket'] });
  }, [currentUser]);

  useEffect(() => {
    if (!socket) return;

    // We can add listeners here if needed, or rely on useVideoCall
    // socket.on('connect', () => ...);

    return () => {
      try {
        socket.disconnect();
      } catch {
        // Ignore errors during disconnect
      }
    };
  }, [socket]);

  const manager = useVideoCall(socket, currentUser);

  useEffect(() => {
    managerRef.current = manager;
  }, [manager]);

  // Allow other components (e.g., Chat) to initiate calls without direct coupling
  useEffect(() => {
    const handler = (e) => {
      const { targetUserId, targetUserName } = e.detail || {};
      if (managerRef.current && targetUserId) {
        managerRef.current.initiateCall(targetUserId, targetUserName);
      }
    };
    window.addEventListener('global-video-call-initiate', handler);
    return () => window.removeEventListener('global-video-call-initiate', handler);
  }, []);

  const value = useMemo(() => ({ manager, socket, currentUser }), [manager, socket, currentUser]);

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};

VideoCallProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useVideoCallContext = () => useContext(VideoCallContext);
