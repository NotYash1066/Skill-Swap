import Peer from 'simple-peer';
import logger from '../utils/logger';

class PeerService {
  constructor() {
    this.peers = new Map();
    this.localStream = null;
    this.socket = null;
    this.currentRoomId = null;
    this.isInitiator = false;
    
    // STUN/TURN servers for NAT traversal
    // Priority:
    //   1. VITE_ICE_SERVERS env var (JSON array) — set at build time
    //   2. Fetched from /api/ice-servers (supports Twilio NTS rotation)
    //   3. Default: Google STUN + OpenRelay TURN (free public TURN, rate-limited)
    this._iceServersResolved = false;
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    };
    this._resolveIceServers();
    
    // Callbacks
    this.onStreamReceived = null;
    this.onPeerDisconnected = null;
    this.onConnectionStateChanged = null;
    this.onError = null;
  }

  // Resolve ICE servers dynamically from the backend API.
  // Falls back to env var (VITE_ICE_SERVERS) if the API call fails.
  async _resolveIceServers() {
    if (this._iceServersResolved) return;

    // Check env var first (build-time config takes priority)
    try {
      const raw = import.meta.env.VITE_ICE_SERVERS;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          logger.info('Using ICE servers from VITE_ICE_SERVERS env var');
          this.iceServers = { iceServers: parsed };
          this._iceServersResolved = true;
          return;
        }
      }
    } catch (e) {
      logger.warn('Failed to parse VITE_ICE_SERVERS:', e);
    }

    // Fetch from backend API (supports Twilio NTS dynamic credentials)
    try {
      // Derive API base URL from the same source as the rest of the app
      const baseUrl = import.meta.env.VITE_API_URL
        || (import.meta.env.PROD ? '' : 'http://localhost:5000');
      const token = localStorage.getItem('token');
      const resp = await fetch(`${baseUrl}/api/ice-servers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.iceServers && data.iceServers.length > 0) {
          logger.info(`ICE servers loaded from API (source: ${data.source || 'unknown'})`);
          this.iceServers = { iceServers: data.iceServers };
          this._iceServersResolved = true;
          return;
        }
      }
    } catch (e) {
      logger.warn('Failed to fetch ICE servers from API, using defaults:', e);
    }

    logger.info('Using default ICE servers (Google STUN + OpenRelay TURN)');
    this._iceServersResolved = true;
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
      logger.debug('Received video offer:', data);
      this.handleVideoOffer(data);
    });

    this.socket.on('video-answer', (data) => {
      logger.debug('Received video answer:', data);
      this.handleVideoAnswer(data);
    });

    this.socket.on('ice-candidate', (data) => {
      logger.debug('Received ICE candidate:', data);
      this.handleIceCandidate(data);
    });

    this.socket.on('user-joined-video', (data) => {
      logger.info('User joined video room:', data);
      this.handleUserJoined(data);
    });

    this.socket.on('participant-disconnected', (data) => {
      logger.info('Participant disconnected:', data);
      this.handleParticipantDisconnected(data);
    });

    this.socket.on('call-ended', (data) => {
      logger.info('Call ended:', data);
      this.handleCallEnded(data);
    });
  }

  // Get user media (camera and microphone)
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      logger.debug('Getting user media with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      logger.info('Local stream obtained successfully');
      return this.localStream;
    } catch (error) {
      logger.error('Error getting user media:', error);
      if (this.onError) this.onError('Failed to access camera/microphone');
      throw error;
    }
  }

  // Get screen sharing stream
  async getDisplayMedia() {
    try {
      logger.debug('Getting display media for screen sharing');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      logger.info('Display stream obtained successfully');
      return displayStream;
    } catch (error) {
      logger.error('Error getting display media:', error);
      if (this.onError) this.onError('Failed to start screen sharing');
      throw error;
    }
  }

  // Create a peer connection
  createPeer(socketId, isInitiator = false, stream = null) {
    logger.info(`Creating peer for socket ${socketId}, initiator: ${isInitiator}`);
    
    const peer = new Peer({
      initiator: isInitiator,
      stream: stream || this.localStream,
      config: this.iceServers,
      trickle: true
    });

    // Handle peer events
    peer.on('signal', (signal) => {
      logger.debug('Peer signal generated:', signal.type);
      
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
      logger.info('Received remote stream from:', socketId);
      if (this.onStreamReceived) {
        this.onStreamReceived(socketId, remoteStream);
      }
    });

    peer.on('connect', () => {
      logger.info('Peer connected:', socketId);
      if (this.onConnectionStateChanged) {
        this.onConnectionStateChanged(socketId, 'connected');
      }
    });

    peer.on('close', () => {
      logger.info('Peer connection closed:', socketId);
      this.removePeer(socketId);
      if (this.onPeerDisconnected) {
        this.onPeerDisconnected(socketId);
      }
    });

    peer.on('error', (error) => {
      logger.error('Peer error:', error);
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
    logger.info('Call ended, cleaning up all peers');
    this.cleanup();
  }

  // Join a video room
  joinRoom(roomId) {
    logger.info('Joining video room:', roomId);
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
      logger.error('Error starting screen share:', error);
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
      logger.error('Error stopping screen share:', error);
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
    logger.debug('Cleaning up peer connections');
    
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