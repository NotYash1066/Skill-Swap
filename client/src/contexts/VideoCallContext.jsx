import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
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
  } catch (e) {
    return null;
  }
};

export const VideoCallProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const managerRef = useRef(null);

  // Initialize current user on mount
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Initialize dedicated socket for video calling
  useEffect(() => {
    if (!currentUser) return;

    const s = io('http://localhost:5000', { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      // useVideoCall will emit register-user
      // Keeping this here in case we need other top-level events later
      // console.log('Video socket connected', s.id);
    });

    s.on('disconnect', () => {
      // console.log('Video socket disconnected');
    });

    return () => {
      try { s.disconnect(); } catch {}
      setSocket(null);
    };
  }, [currentUser]);

  const manager = useVideoCall(socket, currentUser);
  managerRef.current = manager;

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

export const useVideoCallContext = () => useContext(VideoCallContext);
