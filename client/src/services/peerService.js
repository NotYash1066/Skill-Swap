import Peer from 'simple-peer';

class PeerService {
  constructor() {
    this.peers = new Map();
    this.localStream = null;
    this.socket = null;
    this.currentRoomId = null;
    this.isInitiator = false;
    
    // STUN servers for NAT traversal
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ]
    };
    
    // Callbacks
    this.onStreamReceived = null;
    this.onPeerDisconnected = null;
    this.onConnectionStateChanged = null;
    this.onError = null;
  }

  // Initialize with socket connection
  initialize(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  // Set up socket event listeners for signaling
  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('video-offer', (data) => {
      console.log('Received video offer:', data);
      this.handleVideoOffer(data);
    });

    this.socket.on('video-answer', (data) => {
      console.log('Received video answer:', data);
      this.handleVideoAnswer(data);
    });

    this.socket.on('ice-candidate', (data) => {
      console.log('Received ICE candidate:', data);
      this.handleIceCandidate(data);
    });

    this.socket.on('user-joined-video', (data) => {
      console.log('User joined video room:', data);
      this.handleUserJoined(data);
    });

    this.socket.on('participant-disconnected', (data) => {
      console.log('Participant disconnected:', data);
      this.handleParticipantDisconnected(data);
    });

    this.socket.on('call-ended', (data) => {
      console.log('Call ended:', data);
      this.handleCallEnded(data);
    });
  }

  // Get user media (camera and microphone)
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      console.log('Getting user media with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Local stream obtained successfully');
      return this.localStream;
    } catch (error) {
      console.error('Error getting user media:', error);
      if (this.onError) this.onError('Failed to access camera/microphone');
      throw error;
    }
  }

  // Get screen sharing stream
  async getDisplayMedia() {
    try {
      console.log('Getting display media for screen sharing');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      console.log('Display stream obtained successfully');
      return displayStream;
    } catch (error) {
      console.error('Error getting display media:', error);
      if (this.onError) this.onError('Failed to start screen sharing');
      throw error;
    }
  }

  // Create a peer connection
  createPeer(socketId, isInitiator = false, stream = null) {
    console.log(`Creating peer for socket ${socketId}, initiator: ${isInitiator}`);
    
    const peer = new Peer({
      initiator: isInitiator,
      stream: stream || this.localStream,
      config: this.iceServers,
      trickle: true
    });

    // Handle peer events
    peer.on('signal', (signal) => {
      console.log('Peer signal generated:', signal.type);
      
      if (signal.type === 'offer') {
        this.socket.emit('video-offer', {
          roomId: this.currentRoomId,
          offer: signal,
          targetSocketId: socketId
        });
      } else if (signal.type === 'answer') {
        this.socket.emit('video-answer', {
          roomId: this.currentRoomId,
          answer: signal,
          targetSocketId: socketId
        });
      } else {
        // ICE candidate
        this.socket.emit('ice-candidate', {
          roomId: this.currentRoomId,
          candidate: signal,
          targetSocketId: socketId
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream from:', socketId);
      if (this.onStreamReceived) {
        this.onStreamReceived(socketId, remoteStream);
      }
    });

    peer.on('connect', () => {
      console.log('Peer connected:', socketId);
      if (this.onConnectionStateChanged) {
        this.onConnectionStateChanged(socketId, 'connected');
      }
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', socketId);
      this.removePeer(socketId);
      if (this.onPeerDisconnected) {
        this.onPeerDisconnected(socketId);
      }
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      this.removePeer(socketId);
      if (this.onError) {
        this.onError(`Connection error with ${socketId}: ${error.message}`);
      }
    });

    this.peers.set(socketId, peer);
    return peer;
  }

  // Handle incoming video offer
  handleVideoOffer(data) {
    const { offer, senderSocketId, roomId } = data;
    this.currentRoomId = roomId;
    
    const peer = this.createPeer(senderSocketId, false, this.localStream);
    peer.signal(offer);
  }

  // Handle incoming video answer
  handleVideoAnswer(data) {
    const { answer, senderSocketId } = data;
    const peer = this.peers.get(senderSocketId);
    
    if (peer) {
      peer.signal(answer);
    }
  }

  // Handle incoming ICE candidate
  handleIceCandidate(data) {
    const { candidate, senderSocketId } = data;
    const peer = this.peers.get(senderSocketId);
    
    if (peer) {
      peer.signal(candidate);
    }
  }

  // Handle user joined video room
  handleUserJoined(data) {
    const { socketId } = data;
    
    // Create peer as initiator for the new user
    this.createPeer(socketId, true, this.localStream);
  }

  // Handle participant disconnected
  handleParticipantDisconnected(data) {
    const { userId } = data;
    // Note: We'd need socket ID here, but for now we'll clean up by socket ID
    // This would need enhancement based on your user-socket mapping
  }

  // Handle call ended
  handleCallEnded(data) {
    console.log('Call ended, cleaning up all peers');
    this.cleanup();
  }

  // Join a video room
  joinRoom(roomId) {
    console.log('Joining video room:', roomId);
    this.currentRoomId = roomId;
    
    if (this.socket) {
      this.socket.emit('join-video-room', { roomId });
    }
  }

  // Leave current room and cleanup
  leaveRoom() {
    if (this.currentRoomId && this.socket) {
      this.socket.emit('end-video-call', { roomId: this.currentRoomId });
    }
    this.cleanup();
  }

  // Start screen sharing
  async startScreenShare() {
    try {
      const displayStream = await this.getDisplayMedia();
      
      // Replace video track for all peers
      for (const [socketId, peer] of this.peers.entries()) {
        const videoTrack = displayStream.getVideoTracks()[0];
        peer.replaceTrack(this.localStream.getVideoTracks()[0], videoTrack, this.localStream);
      }

      // Notify others about screen sharing
      if (this.socket && this.currentRoomId) {
        this.socket.emit('start-screen-share', { roomId: this.currentRoomId });
      }

      // Handle screen share end
      displayStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return displayStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  // Stop screen sharing
  async stopScreenShare() {
    try {
      // Get camera stream again
      const cameraStream = await this.getUserMedia({ video: true, audio: true });
      
      // Replace display track with camera track for all peers
      for (const [socketId, peer] of this.peers.entries()) {
        const videoTrack = cameraStream.getVideoTracks()[0];
        peer.replaceTrack(this.localStream.getVideoTracks()[0], videoTrack, cameraStream);
      }

      this.localStream = cameraStream;

      // Notify others about screen sharing stop
      if (this.socket && this.currentRoomId) {
        this.socket.emit('stop-screen-share', { roomId: this.currentRoomId });
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
      throw error;
    }
  }

  // Toggle audio
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle video
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Remove a specific peer
  removePeer(socketId) {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.destroy();
      this.peers.delete(socketId);
    }
  }

  // Cleanup all connections
  cleanup() {
    console.log('Cleaning up peer connections');
    
    // Close all peer connections
    for (const [socketId, peer] of this.peers.entries()) {
      peer.destroy();
    }
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.currentRoomId = null;
    this.isInitiator = false;
  }

  // Get connection statistics
  getConnectionStats() {
    const stats = {
      totalPeers: this.peers.size,
      activePeers: 0,
      currentRoom: this.currentRoomId
    };

    for (const [socketId, peer] of this.peers.entries()) {
      if (peer.connected) {
        stats.activePeers++;
      }
    }

    return stats;
  }
}

// Create singleton instance
const peerService = new PeerService();
export default peerService;