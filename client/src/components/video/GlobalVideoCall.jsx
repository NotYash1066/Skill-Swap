import React from 'react';
import { useVideoCallContext } from '../../contexts/VideoCallContext';
import VideoCall from './VideoCall';

const GlobalVideoCall = () => {
  const ctx = useVideoCallContext();
  if (!ctx) return null;
  const { manager, currentUser } = ctx;

  // Render the VideoCall UI bound to the global manager
  return (
    <VideoCall manager={manager} currentUser={currentUser} onCallEnd={() => {}} />
  );
};

export default GlobalVideoCall;
