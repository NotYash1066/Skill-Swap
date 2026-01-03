import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import AdvancedSearch from '../components/AdvancedSearch';
import UserProfile from '../components/UserProfile';
import { FiStar, FiMapPin, FiMessageSquare } from 'react-icons/fi';
import { Button, Card, Spinner } from '../components/common';
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

  const fetchData = useCallback(async () => {
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
  }, [filters, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendMatchRequest = async (recipientId, matchedSkills) => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      await axios.post(API_ENDPOINTS.MATCHES.REQUEST, {
        recipientId,
        message: matchMessage,
        matchedSkills
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedMatch(null);
      setMatchMessage('');
      await fetchData();
    } catch (err) {
      console.error('Error sending match request:', err);
      alert('Failed to send request. Please try again.');
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

      fetchData();
    } catch (err) {
      console.error('Error responding to match:', err);
    }
  };

  const renderPotentialMatches = () => {
    if (potentialMatches.length === 0) {
      return (
        <div className="no-matches">
          <h3>No matches found</h3>
          <p>Update your skills or broaden your search.</p>
        </div>
      );
    }

    return potentialMatches.map(match => (
      <Card key={match._id} className="match-card">
        <div className="match-header">
          <h3 onClick={() => setSelectedUserId(match._id)} className="clickable-name">
            {match.username}
          </h3>
          <div className="match-meta">
            {match.rating > 0 && (
              <div className="rating">
                <FiStar fill="var(--color-accent)" color="var(--color-accent)" size={14} />
                <span>{match.rating.toFixed(1)}</span>
              </div>
            )}
            <div className="compatibility-score">{match.compatibilityScore}% Match</div>
          </div>
        </div>
        
        {match.location?.city && (
          <p className="location"><FiMapPin /> {match.location.city}, {match.location.country}</p>
        )}
        
        <div className="match-skills">
          <div className="skills-section">
            <h4>They Offer:</h4>
            <div className="skills-list">
              {match.skillsOffered.map(skill => (
                <span key={skill} className="skill-tag offered">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="skills-section">
            <h4>They Seek:</h4>
            <div className="skills-list">
              {match.skillsSought.map(skill => (
                <span key={skill} className="skill-tag sought">{skill}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="match-actions">
          <Button onClick={() => setSelectedMatch(match)}>
            Connect
          </Button>
        </div>
      </Card>
    ));
  };

  const renderReceivedRequests = () => {
    if (receivedRequests.length === 0) {
      return (
        <div className="no-requests">
          <h3>No pending requests</h3>
        </div>
      );
    }

    return receivedRequests.map(request => (
      <Card key={request._id} className="match-card request-card">
        <div className="match-header">
          <h3>{request.requester.username}</h3>
          <div className="compatibility-score">{request.compatibilityScore}% Match</div>
        </div>

        <div className="request-message">
          <FiMessageSquare className="msg-icon" />
          <p>{request.message}</p>
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
          <Button variant="secondary" onClick={() => respondToMatch(request._id, 'accepted')}>
            Accept
          </Button>
          <Button variant="outline" onClick={() => respondToMatch(request._id, 'rejected')}>
            Decline
          </Button>
        </div>
      </Card>
    ));
  };

  const renderSentRequests = () => {
    if (sentRequests.length === 0) {
      return (
        <div className="no-requests">
          <h3>No sent requests</h3>
        </div>
      );
    }

    return sentRequests.map(request => (
      <Card key={request._id} className="match-card sent-card">
        <div className="match-header">
          <h3>{request.recipient.username}</h3>
          <div className={`status-badge ${request.status}`}>
            {request.status}
          </div>
        </div>

        <div className="request-message">
          <p>{request.message}</p>
        </div>

        {request.status === 'accepted' && (
          <div className="request-actions">
            <Button onClick={() => navigate('/chat')}>
              Message
            </Button>
          </div>
        )}
      </Card>
    ));
  };

  if (loading) return <div className="loading-screen"><Spinner /><p>Finding matches...</p></div>;

  return (
    <div className="matches-container">
      <header className="matches-top-nav">
        <div className="nav-left">
          <Link to="/dashboard" className="logo">SkillSwap</Link>
        </div>
        <div className="nav-right">
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        </div>
      </header>

      <section className="matches-hero">
        <div className="container">
          <h1>Discovery</h1>
          <p>Find partners to exchange knowledge with.</p>
          <AdvancedSearch onSearch={setFilters} />
        </div>
      </section>

      <main className="matches-content container">
        <div className="match-tabs">
          <button 
            className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover <span>{potentialMatches.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Requests <span>{receivedRequests.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent <span>{sentRequests.length}</span>
          </button>
        </div>

        <div className="matches-grid">
          {activeTab === 'discover' && renderPotentialMatches()}
          {activeTab === 'received' && renderReceivedRequests()}
          {activeTab === 'sent' && renderSentRequests()}
        </div>
      </main>

      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <Card className="modal-content" onClick={e => e.stopPropagation()} title={`Connect with ${selectedMatch.username}`}>
            <div className="modal-skills">
              <h4>Skills to Exchange:</h4>
              <div className="skills-list">
                {selectedMatch.matchedSkills?.map(skill => (
                  <span key={skill} className="skill-tag matched">{skill}</span>
                ))}
              </div>
            </div>

            <div className="modal-form">
              <label>Add a Message:</label>
              <textarea
                value={matchMessage}
                onChange={(e) => setMatchMessage(e.target.value)}
                placeholder="Hi! I'd love to learn..."
                rows={4}
                className="input"
              />
            </div>

            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setSelectedMatch(null)}>Cancel</Button>
              <Button 
                onClick={() => sendMatchRequest(selectedMatch._id, selectedMatch.matchedSkills)}
                disabled={sending || !matchMessage.trim()}
              >
                {sending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {selectedUserId && (
        <UserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
};

export default Matches;
