import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsSought, setSkillsSought] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [socket] = useState(() => io(API_BASE_URL));
  const navigate = useNavigate();

  useEffect(() => {
    return () => socket.close();
  }, [socket]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(API_ENDPOINTS.AUTH.ME, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setSkillsOffered(response.data.skillsOffered || []);
      setSkillsSought(response.data.skillsSought || []);
      setNewBio(response.data.bio || '');

      localStorage.setItem('user', JSON.stringify(response.data));
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const updateBio = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(API_ENDPOINTS.AUTH.PROFILE, {
        bio: newBio.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = { ...user, bio: newBio.trim() };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditingBio(false);
      setSuccessMessage('Bio updated successfully!');
      setError('');
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0] || 'Failed to update bio.');
      } else {
        setError('Failed to update bio. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-container-high transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-on-primary font-bold">swap_calls</span>
              </div>
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dim">SkillSwap</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-medium text-sm tracking-tight">
              <Link to="/dashboard" className="text-primary font-bold border-b-2 border-primary pb-1">Dashboard</Link>
              <Link to="/matches" className="text-on-surface-variant hover:text-primary transition-colors">Matches</Link>
              <Link to="/chat" className="text-on-surface-variant hover:text-primary transition-colors">Chat</Link>
              <Link to="/profile-settings" className="text-on-surface-variant hover:text-primary transition-colors">Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-surface-container-high rounded-full px-4 py-2 gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant" placeholder="Search skills or mentors..." type="text" />
            </div>

            {/* Using existing NotificationBell */}
            <div className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <NotificationBell socket={socket} />
            </div>

            {/* Using existing ThemeToggle */}
            <div className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <ThemeToggle />
            </div>

            <button onClick={handleLogout} className="p-2 hover:bg-surface-container-high rounded-lg transition-all duration-200 text-on-surface-variant">
              <span className="material-symbols-outlined">logout</span>
            </button>

            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary-container/20">
              <img alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl--YtWmX98LLMck0EYYnR9DzbxP_k4y55ka50_eYnKoTO98BKskSPdUlZyQFOVe7f7KQrLK84N9FQysWNcYt7i5rdRirRYqcMOff8qYUEFIVun-55QJn2T_JZA48c7AUOSrb91W0ZuXUPdyOGUAGxS9Z6vF81uny9STW8rxueiKg2u5CfqopYPY--eWaqpStGE04YW9iFFeqVWbQ_Ot16uXH1nBmQSiHNpRZRlg2TTurR3LqABLvEkWFjhAJ3ifc5oGc9zycOdHk" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-screen-2xl mx-auto w-full px-8 py-10">
        {(error || successMessage) && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${error ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
            {error || successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Profile & Skill Clouds */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Profile Summary Card */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_30px_rgb(48,41,80,0.04)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h2 className="font-headline font-extrabold text-2xl tracking-tight mb-2">{user?.username}</h2>

                {editingBio ? (
                  <div className="mb-6 space-y-2">
                    <textarea
                      className="w-full bg-surface-container-high rounded-lg p-3 text-sm border-none focus:ring-2 focus:ring-primary"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      rows="3"
                    ></textarea>
                    <div className="flex gap-2">
                      <button onClick={updateBio} className="px-3 py-1 bg-primary text-on-primary rounded text-xs font-bold">Save</button>
                      <button onClick={() => setEditingBio(false)} className="px-3 py-1 bg-surface-container-highest text-on-surface rounded text-xs font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed flex justify-between items-start">
                    <span>{user?.bio || 'No bio added yet. Add one to tell others about yourself!'}</span>
                    <button onClick={() => setEditingBio(true)} className="text-primary hover:text-primary-dim p-1">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </p>
                )}

                <div className="space-y-4 font-label">
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    <span>{user?.location?.city && user?.location?.country ? `${user.location.city}, ${user.location.country}` : 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg">mail</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                    <span>Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link to="/profile-settings" className="block w-full text-center mt-8 py-3 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform duration-200">
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Tag Clouds */}
            <div className="space-y-6">
              <div>
                <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                  Skills I Offer
                  <span className="h-1 w-1 bg-secondary rounded-full"></span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsOffered.length > 0 ? skillsOffered.map((skill, idx) => (
                    <span key={idx} className="px-4 py-2 bg-secondary/10 text-secondary rounded-full font-label text-xs font-bold tracking-wide uppercase">
                      {skill.name || skill}
                    </span>
                  )) : (
                    <span className="text-sm text-on-surface-variant italic">No skills added yet</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                  Skills I Want to Learn
                  <span className="h-1 w-1 bg-tertiary rounded-full"></span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsSought.length > 0 ? skillsSought.map((skill, idx) => (
                    <span key={idx} className="px-4 py-2 bg-tertiary/10 text-tertiary rounded-full font-label text-xs font-bold tracking-wide uppercase">
                      {skill.name || skill}
                    </span>
                  )) : (
                    <span className="text-sm text-on-surface-variant italic">No skills added yet</span>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Hero & Suggested Matches */}
          <div className="lg:col-span-8 space-y-10">
            {/* Hero Section */}
            <section className="bg-surface-container-low rounded-[2rem] p-10 relative overflow-hidden">
              <div className="max-w-lg relative z-10">
                <h1 className="font-headline font-extrabold text-5xl tracking-tight text-on-surface mb-4">Hello, {user?.username}!</h1>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">Ready for your next learning adventure? Check out your potential matches and start swapping skills today.</p>
                <div className="flex gap-4">
                  <Link to="/matches" className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-dim transition-colors inline-block">Find Matches</Link>
                  <Link to="/chat" className="px-8 py-3 bg-surface-container-highest text-primary rounded-lg font-bold hover:bg-surface-variant transition-colors inline-block">Messages</Link>
                </div>
              </div>

              {/* Abstract Kinetic Element */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block">
                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-l-full opacity-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[8rem] text-primary/20 rotate-12">swap_calls</span>
                </div>
              </div>
            </section>

            {/* Suggested Matches Section header - actual data would come from an API */}
            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Getting Started</h2>
                <Link className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all" to="/matches">
                  Go to Matches <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-8 border border-surface-container-high text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">hub</span>
                </div>
                <h3 className="font-headline font-bold text-xl mb-2">Connect with Others</h3>
                <p className="text-on-surface-variant mb-6 max-w-md mx-auto">Head over to the Matches page to find people who have the skills you want to learn, and want the skills you can offer.</p>
                <Link to="/matches" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-dim transition-colors inline-block">
                  Explore Matches
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
