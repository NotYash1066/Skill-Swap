import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { 
  FiVideo, 
  FiVideoOff, 
  FiMic, 
  FiMicOff, 
  FiPhoneOff, 
  FiMonitor,
  FiUser,
  FiPhone
} from 'react-icons/fi';
import './VideoCall.css';

const VideoCall = ({ onCallEnd, manager }) => {
  if (!manager) return null;

  const {
    isCallActive,
    isIncomingCall,
    callState,
    participants,
    localStream,
    caller,
    error,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    localVideoRef,
    addVideoRef,
    acceptCall,
    rejectCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    resetCallState
  } = manager;

  // Handle call end callback
  useEffect(() => {
    if (callState === 'ended' || callState === 'idle') {
      if (onCallEnd) onCallEnd();
    }
  }, [callState, onCallEnd]);

  // Render different states
  const renderCallContent = () => {
    switch (callState) {
      case 'calling':
        return (
          <div className="call-status-screen">
            <div className="call-status-avatar">
              <FiUser size={60} />
            </div>
            <h2>Calling...</h2>
            <p>Waiting for response</p>
            {/* Local preview while calling */}
            <div className="local-video-container" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
              />
              <div className="local-video-overlay">
                <span className="video-label">You</span>
                {!isVideoEnabled && (
                  <div className="video-disabled-overlay">
                    <FiVideoOff size={32} />
                  </div>
                )}
              </div>
            </div>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <button 
              className="btn-error call-control-btn"
              onClick={endCall}
            >
              <FiPhoneOff size={24} />
              Cancel
            </button>
          </div>
        );

      case 'connecting':
        return (
          <div className="call-status-screen">
            <div className="call-status-avatar">
              <FiVideo size={60} />
            </div>
            <h2>Connecting...</h2>
            <p>Setting up your video call</p>
            {/* Local preview while connecting */}
            <div className="local-video-container" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
              />
              <div className="local-video-overlay">
                <span className="video-label">You</span>
                {!isVideoEnabled && (
                  <div className="video-disabled-overlay">
                    <FiVideoOff size={32} />
                  </div>
                )}
              </div>
            </div>
            <div className="spinner"></div>
          </div>
        );

      case 'connected':
        return (
          <div className="video-call-active">
            {/* Local Video */}
            <div className="local-video-container">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
              />
              <div className="local-video-overlay">
                <span className="video-label">You</span>
                {!isVideoEnabled && (
                  <div className="video-disabled-overlay">
                    <FiVideoOff size={32} />
                  </div>
                )}
              </div>
            </div>

            {/* Remote Videos */}
            <div className="remote-videos-grid">
              {Array.from(participants.entries()).map(([socketId, participant]) => (
                <div
                  key={socketId}
                  className="remote-video-container"
                >
                  <video
                    ref={(el) => addVideoRef(socketId, el)}
                    autoPlay
                    playsInline
                    className="remote-video"
                  />
                  <div className="remote-video-overlay">
                    {participant.isScreenSharing && (
                      <div className="screen-share-indicator">
                        <FiMonitor size={16} />
                        <span>Sharing screen</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Video Controls */}
            <div className="video-controls">
              <div className="controls-group">
                <button
                  className={`control-btn ${isMuted ? 'muted' : ''}`}
                  onClick={toggleMicrophone}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                </button>

                <button
                  className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
                  onClick={toggleCamera}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
                </button>

                <button
                  className={`control-btn ${isScreenSharing ? 'active' : ''}`}
                  onClick={toggleScreenShare}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  <FiMonitor size={20} />
                </button>

                <button
                  className="control-btn end-call-btn"
                  onClick={endCall}
                  title="End call"
                >
                  <FiPhoneOff size={20} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'rejected':
        return (
          <div className="call-status-screen error">
            <div className="call-status-avatar error">
              <FiPhoneOff size={60} />
            </div>
            <h2>Call Declined</h2>
            <p>The other user declined your call</p>
            <button 
              className="btn-secondary"
              onClick={resetCallState}
            >
              Close
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="call-status-screen error">
            <div className="call-status-avatar error">
              <FiPhoneOff size={60} />
            </div>
            <h2>Call Failed</h2>
            <p>{error || 'An error occurred during the call'}</p>
            <button 
              className="btn-secondary"
              onClick={resetCallState}
            >
              Close
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Don't render anything if no call is active
  if (callState === 'idle' && !isIncomingCall) {
    return null;
  }

  return (
    <div className="video-call-overlay">
        <div className="video-call-container">
          {/* Incoming Call Modal */}
          {isIncomingCall && (
              <div className="incoming-call-modal">
                <div className="incoming-call-content">
                  <div className="caller-avatar">
                    <FiUser size={50} />
                  </div>
                  <h2>Incoming Video Call</h2>
                  <p className="caller-name">{caller?.callerName || 'Unknown User'}</p>
                  <p className="call-type">Video Call</p>
                  
                  <div className="incoming-call-actions">
                    <button
                      className="btn-error call-action-btn"
                      onClick={rejectCall}
                    >
                      <FiPhoneOff size={24} />
                      Decline
                    </button>
                    
                    <button
                      className="btn-success call-action-btn"
                      onClick={acceptCall}
                    >
                      <FiPhone size={24} />
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Main Call Content */}
          {!isIncomingCall && (
            <div className="video-call-main">
              {renderCallContent()}
            </div>
          )}
        </div>
      </div>
  );
};

export default VideoCall;

VideoCall.propTypes = {
  onCallEnd: PropTypes.func,
  manager: PropTypes.object,
};
