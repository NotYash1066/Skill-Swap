import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const Matches = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchMessage, setMatchMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', location: '', minRating: '' });
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.location) params.append('city', filters.location);
      if (filters.minRating) params.append('minRating', filters.minRating);

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
        message: matchMessage || "Hi! Let's swap skills.",
        matchedSkills: matchedSkills || []
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderDiscoverMatches = () => {
    if (potentialMatches.length === 0) {
      return (
        <div className="xl:col-span-2 text-center p-12 bg-surface-container-low rounded-xl border border-dashed border-outline/30">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">search_off</span>
          <h3 className="font-headline text-2xl font-bold mb-2">No Matches Found</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">We couldn't find any matches with your current skills and filters. Try adjusting your search or adding more skills to your profile.</p>
        </div>
      );
    }

    // Sort matches by compatibility score (descending)
    const sortedMatches = [...potentialMatches].sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));

    // Feature the highest match if score > 80
    const featuredMatch = sortedMatches.length > 0 && sortedMatches[0].compatibilityScore > 80 ? sortedMatches[0] : null;
    const regularMatches = featuredMatch ? sortedMatches.slice(1) : sortedMatches;

    return (
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2 gap-8' : 'grid-cols-1 gap-4'}`}>
        {/* Featured Match Card */}
        {featuredMatch && viewMode === 'grid' && (
          <div className="xl:col-span-2 relative group overflow-hidden rounded-xl bg-surface-container-highest p-1">
            <div className="absolute inset-0 kinetic-gradient opacity-10"></div>
            <div className="relative bg-surface-container-lowest p-8 rounded-[1.25rem] flex flex-col md:flex-row gap-8 items-center border border-primary/10">
              <div className="relative w-48 h-48 flex-shrink-0">
                <div className="absolute -inset-2 bg-secondary-fixed opacity-20 rounded-full blur-xl animate-pulse"></div>
                <div className="w-full h-full rounded-full border-4 border-white relative z-10 bg-surface-container-high flex items-center justify-center text-5xl font-bold text-primary">
                  {featuredMatch.username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest z-20">Top Match</div>
              </div>

              <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline text-2xl font-black text-on-surface">{featuredMatch.username}</h3>
                    <p className="font-label text-sm text-on-surface-variant">
                      {featuredMatch.location?.city ? `${featuredMatch.location.city}, ${featuredMatch.location.country}` : 'Location hidden'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-primary">{featuredMatch.compatibilityScore}%</div>
                    <div className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Match Score</div>
                  </div>
                </div>

                <p className="text-on-surface-variant mb-6 text-sm leading-relaxed max-w-2xl">
                  {featuredMatch.bio || "This user hasn't written a bio yet, but their skills match yours perfectly!"}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-2">They Offer</span>
                    <div className="flex flex-wrap gap-2">
                      {featuredMatch.skillsOffered.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-2">They Want</span>
                    <div className="flex flex-wrap gap-2">
                      {featuredMatch.skillsSought.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedMatch(featuredMatch)}
                    className="kinetic-gradient text-on-primary px-8 py-3 rounded-lg font-bold shadow-md hover:scale-[1.02] transition-transform w-full sm:w-auto text-center"
                  >
                    Connect Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Match Cards */}
        {regularMatches.map(match => (
          <div key={match._id} className="bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_24px_48px_rgba(48,41,80,0.08)] transition-all duration-300 group border border-transparent hover:border-outline-variant/20 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center text-xl font-bold text-on-surface shrink-0">
                {match.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-headline text-lg font-bold truncate">{match.username}</h4>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span className="truncate">{match.location?.city || 'Remote'}</span>
                </div>
              </div>
              <div className="bg-primary-container/20 text-primary px-3 py-1 rounded-lg text-xs font-black shrink-0">
                {match.compatibilityScore || 0}% Match
              </div>
            </div>

            <p className="text-sm text-on-surface-variant line-clamp-2 mb-6 flex-grow">
              {match.bio || "Ready to exchange skills and learn together."}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
              <div>
                <span className="block font-bold mb-1 text-on-surface">Offers:</span>
                <p className="text-on-surface-variant truncate">{match.skillsOffered.join(', ') || 'None listed'}</p>
              </div>
              <div>
                <span className="block font-bold mb-1 text-on-surface">Wants:</span>
                <p className="text-on-surface-variant truncate">{match.skillsSought.join(', ') || 'None listed'}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMatch(match)}
              className="w-full py-3 rounded-lg bg-surface-container-low text-primary font-bold text-sm group-hover:kinetic-gradient group-hover:text-on-primary transition-all mt-auto"
            >
              Request Swap
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderRequestsList = (requests, isReceived) => {
    if (requests.length === 0) {
      return (
        <div className="text-center p-12 bg-surface-container-low rounded-xl border border-dashed border-outline/30 mt-8">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
            {isReceived ? 'inbox' : 'send'}
          </span>
          <h3 className="font-headline text-xl font-bold mb-2">No {isReceived ? 'Received' : 'Sent'} Requests</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {isReceived ? "You don't have any pending match requests. Check back later!" : "You haven't sent any requests yet. Explore matches to connect with others."}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 mt-8">
        {requests.map(request => {
          const otherUser = isReceived ? request.requester : request.recipient;

          return (
            <div key={request._id} className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center text-xl font-bold text-on-surface shrink-0">
                {otherUser.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start sm:items-center mb-2">
                  <h4 className="font-headline text-lg font-bold">{otherUser.username}</h4>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    request.status === 'pending' ? 'bg-secondary/10 text-secondary-dim' :
                    request.status === 'accepted' ? 'bg-primary-container text-on-primary-container' :
                    'bg-error-container text-on-error-container'
                  }`}>
                    {request.status}
                  </div>
                </div>

                <div className="bg-surface-container-low p-3 rounded-lg text-sm text-on-surface mb-3 border-l-4 border-primary/40">
                  <span className="font-bold block text-xs text-on-surface-variant mb-1">Message:</span>
                  {request.message || "I'd like to connect and swap skills!"}
                </div>

                {request.matchedSkills && request.matchedSkills.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">Matched on:</span>
                    <div className="flex flex-wrap gap-1">
                      {request.matchedSkills.map(skill => (
                        <span key={skill} className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col w-full sm:w-auto gap-2 shrink-0">
                {isReceived && request.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => respondToMatch(request._id, 'accepted')}
                      className="flex-1 sm:w-32 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md hover:bg-primary-dim transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToMatch(request._id, 'rejected')}
                      className="flex-1 sm:w-32 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-bold hover:bg-error/10 hover:text-error transition-colors"
                    >
                      Decline
                    </button>
                  </>
                ) : request.status === 'accepted' ? (
                  <button
                    onClick={() => navigate('/chat')}
                    className="w-full sm:w-32 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold shadow-md hover:bg-secondary-dim transition-colors"
                  >
                    Message
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold">Finding matches...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-container-high transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-on-primary font-bold">swap_calls</span>
              </div>
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dim">SkillSwap</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-medium text-sm tracking-tight">
              <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/matches" className="text-primary font-bold border-b-2 border-primary pb-1">Matches</Link>
              <Link to="/chat" className="text-on-surface-variant hover:text-primary transition-colors">Chat</Link>
              <Link to="/profile-settings" className="text-on-surface-variant hover:text-primary transition-colors">Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <ThemeToggle />
            </div>

            <button onClick={handleLogout} className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <span className="material-symbols-outlined">logout</span>
            </button>

            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary-container/20 bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-screen-2xl mx-auto w-full px-4 sm:px-8 py-10 flex flex-col lg:flex-row gap-8">

        {/* Filter Sidebar - Only show on discover tab */}
        {activeTab === 'discover' && (
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-surface-container-low p-6 sm:p-8 rounded-xl lg:sticky lg:top-28">
              <h2 className="font-headline text-xl font-bold mb-6 text-on-surface">Filters</h2>

              <div className="mb-6">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-3">Skill Keyword</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-md py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. React"
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-3">Location</label>
                <input
                  className="w-full bg-surface-container-highest border-none rounded-md py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. New York"
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>

              <button
                onClick={fetchData}
                className="w-full kinetic-gradient text-on-primary font-bold py-3 sm:py-4 rounded-lg shadow-md hover:opacity-90 transition-opacity mt-4"
              >
                Apply Discoveries
              </button>
            </div>
          </aside>
        )}

        {/* Results Canvas */}
        <section className="flex-grow min-w-0">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Find Your Match</h1>
              <p className="text-on-surface-variant max-w-md text-sm sm:text-base">Discover experts ready to exchange knowledge. Connect with people who complement your growth.</p>
            </div>

            {activeTab === 'discover' && (
              <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-full self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 sm:px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 sm:px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  List
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 border-b border-surface-container-high mb-8 overflow-x-auto pb-px custom-scrollbar">
            <button
              onClick={() => setActiveTab('discover')}
              className={`pb-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'discover' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              Discover
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs">{potentialMatches.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`pb-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'received' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              Requests Received
              {receivedRequests.length > 0 && (
                <span className="bg-error text-on-error px-2 py-0.5 rounded-full text-xs">{receivedRequests.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-4 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sent' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              Sent Requests
            </button>
          </div>

          {/* Main Content Area */}
          <div>
            {activeTab === 'discover' && renderDiscoverMatches()}
            {activeTab === 'received' && renderRequestsList(receivedRequests, true)}
            {activeTab === 'sent' && renderRequestsList(sentRequests, false)}
          </div>
        </section>
      </main>

      {/* Connect Modal Overlay */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)}>
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-headline text-xl font-bold">Connect with {selectedMatch.username}</h3>
              <button onClick={() => setSelectedMatch(null)} className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-surface-container-high p-4 rounded-xl">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">swap_horiz</span>
                  Skill Exchange Proposal
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-on-surface-variant block mb-1">You can offer:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedMatch.skillsSought.slice(0, 3).map(skill => (
                        <span key={skill} className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block mb-1">You want to learn:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedMatch.skillsOffered.slice(0, 3).map(skill => (
                        <span key={skill} className="bg-primary/10 text-primary px-2 py-1 rounded">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Message</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
                  placeholder={`Hi ${selectedMatch.username}, I noticed we have complementary skills! I'd love to swap knowledge with you...`}
                  value={matchMessage}
                  onChange={e => setMatchMessage(e.target.value)}
                ></textarea>
                <p className="text-xs text-on-surface-variant mt-2 text-right">Introduce yourself and mention what you'd like to learn from them.</p>
              </div>
            </div>

            <div className="p-6 border-t border-surface-container-high flex justify-end gap-3 bg-surface">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendMatchRequest(selectedMatch._id, selectedMatch.skillsOffered)}
                disabled={sending}
                className="px-6 py-2.5 rounded-xl font-bold text-sm kinetic-gradient text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
