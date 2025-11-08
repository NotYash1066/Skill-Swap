import React, { useEffect } from 'react';
import useVideoCall from '../../hooks/useVideoCall';

const VideoCallInitiator = ({ socket, currentUser, targetUser, onCallEnd }) => {
  const {
    initiateCall,
    resetCallState
  } = useVideoCall(socket, currentUser);

  useEffect(() => {
    // Automatically initiate the call when component mounts
    if (targetUser && targetUser._id) {
      console.log('Initiating video call to:', targetUser.username);
      initiateCall(targetUser._id, targetUser.username);
    }

    // Cleanup when component unmounts
    return () => {
      resetCallState();
      if (onCallEnd) onCallEnd();
    };
  }, [targetUser, initiateCall, resetCallState, onCallEnd]);

  // This component doesn't render anything visible
  // It just triggers the call initiation logic
  return null;
};

export default VideoCallInitiator;