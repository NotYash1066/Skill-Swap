import React from 'react';
import { useVideoCallContext } from '../../contexts/VideoCallContext';
import VideoCall from './VideoCall';

const GlobalVideoCall = () => {
  const ctx = useVideoCallContext();
  if (!ctx) return null;
  const { manager } = ctx;

  return <VideoCall manager={manager} onCallEnd={() => {}} />;
};

export default GlobalVideoCall;
