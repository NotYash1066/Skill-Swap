import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import AdvancedSearch from '../components/AdvancedSearch';
import UserProfile from '../components/UserProfile';
import { FiStar } from 'react-icons/fi';
import '../styles/Matches.css';

const Matches = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchMessage, setMatchMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.country) params.append('country', filters.country);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.availability?.length) filters.availability.forEach(a => params.append('availability', a));

      const [potentialRes, receivedRes, sentRes] = await Promise.all([
        axios.get(`${API_ENDPOINTS.MATCHES.POTENTIAL}?${params}`, { headers }),
        axios.get(API_ENDPOINTS.MATCHES.RECEIVED, { headers }),
        axios.get(API_ENDPOINTS.MATCHES.SENT, { headers })
      ]);

      console.log('Potential matches:', potentialRes.data);
      console.log('Received requests:', receivedRes.data);
      console.log('Sent requests:', sentRes.data);

      setPotentialMatches(potentialRes.data);
      setReceivedRequests(receivedRes.data);
      setSentRequests(sentRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching matches:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setLoading(false);
    }
  };

  const sendMatchRequest = async (recipientId, matchedSkills) => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.MATCHES.REQUEST, {
        recipientId,
        message: matchMessage,
        matchedSkills
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Match request sent successfully:', response.data);
      setSelectedMatch(null);
      setMatchMessage('');
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error sending match request:', err);
      const serverMsg = err.response?.data?.msg
        || err.response?.data?.errors?.[0]
        || err.response?.data?.message
        || err.message
        || 'Failed to send request. Please try again.';
      alert(`Error: ${serverMsg}`);
    } finally {
      setSending(false);
    }
  };

  const respondToMatch = async (matchId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(API_ENDPOINTS.MATCHES.RESPOND(matchId), {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error responding to match:', err);
    }
  };

  const renderPotentialMatches = () => {
    if (potentialMatches.length === 0) {
      return (
        <div className="no-matches">
          <h3>No potential matches found</h3>
          <p>Try adding more skills to your profile to find better matches!</p>
        </div>
      );
    }

    return potentialMatches.map(match => (
      <div key={match._id} className="match-card">
        <div className="match-header">
          <h3 onClick={() => setSelectedUserId(match._id)} style={{cursor: 'pointer'}}>{match.username}</h3>
          <div className="match-info">
            {match.rating > 0 && (
              <div className="rating">
                <FiStar fill="#ffd700" color="#ffd700" size={16} />
                <span>{match.rating.toFixed(1)}</span>
              </div>
            )}
            <div className="compatibility-score">{match.compatibilityScore}% Match</div>
          </div>
        </div>
        {match.location?.city && (
          <p className="location">📍 {match.location.city}{match.location.country ? `, ${match.location.country}` : ''}</p>
        )}
        
        <div className="match-skills">
          <div className="skills-section">
            <h4>Skills they offer (that you want):</h4>
            <div className="skills-list">
              {match.skillsOffered.filter(skill => 
                // Current user's sought skills that match this user's offered skills
                JSON.parse(localStorage.getItem('user'))?.skillsSought?.includes(skill)
              ).map(skill => (
                <span key={skill} className="skill-tag offered">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="skills-section">
            <h4>Skills they want (that you offer):</h4>
            <div className="skills-list">
              {match.skillsSought.filter(skill => 
                // Current user's offered skills that match this user's sought skills
                JSON.parse(localStorage.getItem('user'))?.skillsOffered?.includes(skill)
              ).map(skill => (
                <span key={skill} className="skill-tag sought">{skill}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="match-actions">
          <button 
            className="connect-btn"
            onClick={() => setSelectedMatch(match)}
          >
            Send Connection Request
          </button>
        </div>
      </div>
    ));
  };

  const renderReceivedRequests = () => {
    if (receivedRequests.length === 0) {
      return (
        <div className="no-requests">
          <h3>No pending requests</h3>
          <p>You don't have any connection requests at the moment.</p>
        </div>
      );
    }

    return receivedRequests.map(request => (
      <div key={request._id} className="match-card request-card">
        <div className="match-header">
          <h3>{request.requester.username}</h3>
          <div className="compatibility-score">{request.compatibilityScore}% Match</div>
        </div>

        <div className="request-message">
          <p>"{request.message}"</p>
        </div>

        <div className="match-skills">
          <h4>Matched Skills:</h4>
          <div className="skills-list">
            {request.matchedSkills.map(skill => (
              <span key={skill} className="skill-tag matched">{skill}</span>
            ))}
          </div>
        </div>

        <div className="request-actions">
          <button 
            className="accept-btn"
            onClick={() => respondToMatch(request._id, 'accepted')}
          >
            Accept
          </button>
          <button 
            className="reject-btn"
            onClick={() => respondToMatch(request._id, 'rejected')}
          >
            Decline
          </button>
        </div>
      </div>
    ));
  };

  const renderSentRequests = () => {
    if (sentRequests.length === 0) {
      return (
        <div className="no-requests">
          <h3>No sent requests</h3>
          <p>You haven't sent any connection requests yet.</p>
        </div>
      );
    }

    return sentRequests.map(request => (
      <div key={request._id} className="match-card sent-card">
        <div className="match-header">
          <h3>{request.recipient.username}</h3>
          <div className={`status-badge ${request.status}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </div>
        </div>

        <div className="request-message">
          <p>"{request.message}"</p>
        </div>

        <div className="match-skills">
          <h4>Matched Skills:</h4>
          <div className="skills-list">
            {request.matchedSkills.map(skill => (
              <span key={skill} className="skill-tag matched">{skill}</span>
            ))}
          </div>
        </div>

        {request.status === 'accepted' && (
          <div className="request-actions">
            <button 
              className="chat-btn"
              onClick={() => navigate('/chat')}
            >
              Start Chatting
            </button>
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="matches-container">
        <div className="loading">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="matches-container">
      <div className="matches-header">
        <div className="header-top">
          <Link to="/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
          <Link to="/profile-settings" className="back-btn">
            Profile Settings
          </Link>
          <ThemeToggle />
        </div>
        <h1>Find Your Perfect Match</h1>
        <p>Connect with people who have the skills you need and want to learn what you offer</p>
        <AdvancedSearch onSearch={setFilters} />
      </div>

      <div className="matches-content">
        <div className="match-tabs">
          <button 
            className={`tab-button ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover ({potentialMatches.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Requests ({receivedRequests.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        <div className="matches-grid">
          {activeTab === 'discover' && renderPotentialMatches()}
          {activeTab === 'received' && renderReceivedRequests()}
          {activeTab === 'sent' && renderSentRequests()}
        </div>
      </div>

      {/* Connection Request Modal */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Send Connection Request to {selectedMatch.username}</h3>
            
            <div className="modal-skills">
              <h4>You'll be connecting based on these skills:</h4>
              <div className="skills-list">
                {selectedMatch.matchedSkills.map(skill => (
                  <span key={skill} className="skill-tag matched">{skill}</span>
                ))}
              </div>
            </div>

            <div className="modal-form">
              <label>Personal Message:</label>
              <textarea
                value={matchMessage}
                onChange={(e) => setMatchMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like to connect..."
                rows={4}
                maxLength={500}
              />
              <small>{matchMessage.length}/500 characters</small>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setSelectedMatch(null)}
              >
                Cancel
              </button>
              <button 
                className="send-btn"
                onClick={() => sendMatchRequest(selectedMatch._id, selectedMatch.matchedSkills)}
                disabled={sending || !matchMessage.trim()}
              >
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserId && (
        <UserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
};

export default Matches;
