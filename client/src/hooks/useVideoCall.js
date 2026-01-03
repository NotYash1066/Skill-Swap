import { useState, useEffect, useCallback, useRef } from 'react';
import peerService from '../services/peerService';

const useVideoCall = (socket, currentUser) => {
  // Call states
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callState, setCallState] = useState('idle'); // idle, calling, connecting, connected, ended
  const [participants, setParticipants] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [caller, setCaller] = useState(null);
  const [error, setError] = useState(null);
  
  // Control states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Refs for video elements
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(new Map());

  // Reset call state - MOVED UP before it's used
  const resetCallState = useCallback(() => {
    setIsCallActive(false);
    setIsIncomingCall(false);
    setCallState('idle');
    setParticipants(new Map());
    setLocalStream(null);
    setCurrentRoomId(null);
    setCaller(null);
    setError(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    remoteVideosRef.current.clear();
  }, []);

  // End active call - MOVED UP before it's used
  const endCall = useCallback(() => {
    console.log('Ending video call');
    
    peerService.leaveRoom();
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Clear local video element to release camera reference
    const el = localVideoRef.current;
    if (el) {
      el.srcObject = null;
    }

    resetCallState();
  }, [localStream, resetCallState]);

  // Handle remote stream received
  const handleRemoteStream = useCallback((socketId, stream) => {
    console.log('Remote stream received from:', socketId);
    
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.set(socketId, {
        socketId,
        stream,
        isScreenSharing: false
      });
      return updated;
    });

    // Set video element if ref exists
    const videoElement = remoteVideosRef.current.get(socketId);
    if (videoElement) {
      videoElement.srcObject = stream;
      const p = videoElement.play?.();
      if (p && typeof p.then === 'function') p.catch(() => {});
    }
  }, []);

  // Handle peer disconnected
  const handlePeerDisconnected = useCallback((socketId) => {
    console.log('Peer disconnected:', socketId);
    
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(socketId);
      return updated;
    });

    remoteVideosRef.current.delete(socketId);
  }, []);

  // Handle connection state changed
  const handleConnectionStateChanged = useCallback((socketId, state) => {
    console.log(`Connection state changed for ${socketId}:`, state);
  }, []);

  // Handle peer error
  const handlePeerError = useCallback((message) => {
    console.error('Peer error:', message);
    setError(message);
  }, []);

  // Handle incoming call
  const handleIncomingCall = useCallback((data) => {
    console.log('Incoming video call:', data);
    setCaller(data);
    setIsIncomingCall(true);
    setCurrentRoomId(data.roomId);
    setCallState('incoming');
  }, []);

  // Handle call initiated confirmation
  const handleCallInitiated = useCallback((data) => {
    console.log('Call initiated:', data);
    setCurrentRoomId(data.roomId);
    setCallState('calling');
  }, []);

  // Handle call accepted
  const handleCallAccepted = useCallback(async (data) => {
    console.log('Call accepted:', data);
    setCallState('connecting');
    setCurrentRoomId(data.roomId);
    
    try {
      // Get user media
      const stream = await peerService.getUserMedia();
      setLocalStream(stream);
      
      // Set local video (in case preview is already in DOM)
      const el = localVideoRef.current;
      if (el) {
        el.srcObject = stream;
        const p = el.play?.();
        if (p && typeof p.then === 'function') p.catch(() => {});
      }
      
      // Join the video room
      peerService.joinRoom(data.roomId);
    } catch (error) {
      console.error('Error setting up video call:', error);
      setError('Failed to setup video call');
      setCallState('error');
    }
  }, []);

  // Handle call rejected
  const handleCallRejected = useCallback((data) => {
    console.log('Call rejected:', data);
    setCallState('rejected');
    setError('Call was declined');

    // Stop any active local media if we already acquired it during calling
    try {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      const el = localVideoRef.current;
      if (el) el.srcObject = null;
    } catch (e) {
      // Ignore cleanup errors
    }

    setTimeout(() => {
      resetCallState();
    }, 3000);
  }, [localStream, resetCallState]);

  // Handle call error
  const handleCallError = useCallback((data) => {
    console.error('Call error:', data);
    setError(data.message);
    setCallState('error');
    // Ensure camera is released on error
    try {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      const el = localVideoRef.current;
      if (el) el.srcObject = null;
    } catch (e) {
      // Ignore cleanup errors
    }
  }, [localStream]);

  // Handle call ended
  const handleCallEnded = useCallback((data) => {
    console.log('Call ended:', data);
    setCallState('ended');
    endCall();
  }, [endCall]);

  // Handle joined video room
  const handleJoinedVideoRoom = useCallback(() => {
    console.log('Successfully joined video room');
    setIsCallActive(true);
    setCallState('connected');
  }, []);

  // Handle screen share events
  const handleScreenShareStarted = useCallback((data) => {
    console.log('Screen share started by:', data.userId);
    setParticipants(prev => {
      const updated = new Map(prev);
      const participant = updated.get(data.socketId);
      if (participant) {
        participant.isScreenSharing = true;
        updated.set(data.socketId, participant);
      }
      return updated;
    });
  }, []);

  const handleScreenShareStopped = useCallback((data) => {
    console.log('Screen share stopped by:', data.userId);
    setParticipants(prev => {
      const updated = new Map(prev);
      const participant = updated.get(data.socketId);
      if (participant) {
        participant.isScreenSharing = false;
        updated.set(data.socketId, participant);
      }
      return updated;
    });
  }, []);

  // Ensure local video element gets the stream when available or when element mounts
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      try {
        el.srcObject = localStream;
        const p = el.play?.();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
      } catch (e) {
        // no-op: some browsers set srcObject synchronously only
      }
    }
  }, [localStream]);

  // Initialize peer service
  useEffect(() => {
    if (socket && currentUser) {
      peerService.initialize(socket);
      
      // Register current user
      socket.emit('register-user', currentUser.id);
      
      // Set up peer service callbacks
      peerService.onStreamReceived = handleRemoteStream;
      peerService.onPeerDisconnected = handlePeerDisconnected;
      peerService.onConnectionStateChanged = handleConnectionStateChanged;
      peerService.onError = handlePeerError;
    }
  }, [socket, currentUser, handleRemoteStream, handlePeerDisconnected, handleConnectionStateChanged, handlePeerError]);

  // Set up socket listeners for call management
  useEffect(() => {
    if (!socket) return;

    // Handle incoming call invitation
    socket.on('incoming-video-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-initiated', handleCallInitiated);
    socket.on('call-error', handleCallError);
    socket.on('call-ended', handleCallEnded);
    socket.on('joined-video-room', handleJoinedVideoRoom);
    socket.on('screen-share-started', handleScreenShareStarted);
    socket.on('screen-share-stopped', handleScreenShareStopped);

    return () => {
      socket.off('incoming-video-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-initiated', handleCallInitiated);
      socket.off('call-error', handleCallError);
      socket.off('call-ended', handleCallEnded);
      socket.off('joined-video-room', handleJoinedVideoRoom);
      socket.off('screen-share-started', handleScreenShareStarted);
      socket.off('screen-share-stopped', handleScreenShareStopped);
    };
  }, [socket, handleIncomingCall, handleCallAccepted, handleCallRejected, handleCallInitiated, handleCallError, handleCallEnded, handleJoinedVideoRoom, handleScreenShareStarted, handleScreenShareStopped]);

  // Cleanup on unmount to stop camera/mic and peers
  useEffect(() => {
    const videoElement = localVideoRef.current; // Capture ref value
    return () => {
      try {
        peerService.cleanup();
      } catch (e) {
        // Ignore cleanup errors
      }

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, []);

  // Initiate a video call
  const initiateCall = useCallback(async (targetUserId) => {
    try {
      setCallState('calling');
      setError(null);

      // Get user media first
      const stream = await peerService.getUserMedia();
      setLocalStream(stream);
      
      // Set local video (in case preview is already in DOM)
      const el = localVideoRef.current;
      if (el) {
        el.srcObject = stream;
        const p = el.play?.();
        if (p && typeof p.then === 'function') p.catch(() => {});
      }

      // Send call invitation
      socket.emit('initiate-video-call', {
        targetUserId,
        callerId: currentUser.id,
        callerName: currentUser.username || currentUser.name
      });

    } catch (error) {
      console.error('Error initiating call:', error);
      setError('Failed to start video call');
      setCallState('error');
    }
  }, [socket, currentUser]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    try {
      setIsIncomingCall(false);
      setCallState('connecting');

      // Get user media
      const stream = await peerService.getUserMedia();
      setLocalStream(stream);
      
      // Set local video (in case preview is already in DOM)
      const el = localVideoRef.current;
      if (el) {
        el.srcObject = stream;
        const p = el.play?.();
        if (p && typeof p.then === 'function') p.catch(() => {});
      }

      // Accept the call
      socket.emit('accept-video-call', {
        roomId: currentRoomId,
        callerId: caller.callerId
      });

    } catch (error) {
      console.error('Error accepting call:', error);
      setError('Failed to accept call');
      setCallState('error');
    }
  }, [socket, currentRoomId, caller]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    setIsIncomingCall(false);
    socket.emit('reject-video-call', {
      roomId: currentRoomId,
      callerId: caller.callerId,
      reason: 'declined'
    });
    resetCallState();
  }, [socket, currentRoomId, caller, resetCallState]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    peerService.toggleAudio(!newMutedState);
  }, [isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);
    peerService.toggleVideo(newVideoState);
  }, [isVideoEnabled]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await peerService.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        const displayStream = await peerService.startScreenShare();
        setIsScreenSharing(true);
        
        // Update local video with screen share
        const el = localVideoRef.current;
        if (el) {
          el.srcObject = displayStream;
          const p = el.play?.();
          if (p && typeof p.then === 'function') p.catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError('Failed to toggle screen sharing');
    }
  }, [isScreenSharing]);

  // Add video ref for remote participant
  const addVideoRef = useCallback((socketId, element) => {
    if (element) {
      remoteVideosRef.current.set(socketId, element);
      
      // Set stream if participant already exists
      const participant = participants.get(socketId);
      if (participant && participant.stream) {
        element.srcObject = participant.stream;
        const p = element.play?.();
        if (p && typeof p.then === 'function') p.catch(() => {});
      }
    } else {
      remoteVideosRef.current.delete(socketId);
    }
  }, [participants]);

  return {
    // Call states
    isCallActive,
    isIncomingCall,
    callState,
    participants,
    localStream,
    currentRoomId,
    caller,
    error,
    
    // Control states
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    
    // Video refs
    localVideoRef,
    addVideoRef,
    
    // Actions
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    resetCallState
  };
};

export default useVideoCall;
