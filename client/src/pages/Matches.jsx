import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../config/api';
import Navbar from '../components/common/Navbar';
import { clearAuthState, notifyAuthStateChange } from '../utils/auth';

const ensureArray = (value) => Array.isArray(value) ? value : [];

const Matches = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [featuredMatch, setFeaturedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  const fetchMatches = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/login');
        return;
      }

      setError('');
      const headers = { Authorization: `Bearer ${token}` };
      const [potentialRes, receivedRes, sentRes] = await Promise.all([
        axios.get(API_ENDPOINTS.MATCHES.POTENTIAL, { headers }),
        axios.get(API_ENDPOINTS.MATCHES.RECEIVED, { headers }),
        axios.get(API_ENDPOINTS.MATCHES.SENT, { headers })
      ]);

      const potential = ensureArray(potentialRes.data);
      setPotentialMatches(potential);
      setReceivedRequests(ensureArray(receivedRes.data));
      setSentRequests(ensureArray(sentRes.data));
      setFeaturedMatch(potential[0] ?? null);
      setMatches(potential.slice(1));
    } catch (err) {
		console.error('Error fetching matches:', err);
		if (err.response?.status === 401) {
			clearAuthState();
			notifyAuthStateChange();
			navigate('/login');
			return;
      }

      setPotentialMatches([]);
      setReceivedRequests([]);
      setSentRequests([]);
      setFeaturedMatch(null);
      setMatches([]);
      setError('We could not load live match data right now. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
        <p className="ml-4 font-headline font-bold text-on-surface animate-pulse" aria-live="polite">Discovering experts...</p>
      </div>
    );
  }

  const hasNoMatches = !error && potentialMatches.length === 0;
  const gridClass =
    viewMode === 'list'
      ? 'grid grid-cols-1 gap-6'
      : 'grid grid-cols-1 xl:grid-cols-2 gap-8';

  return (
    <div className="bg-surface font-body text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-screen-2xl mx-auto w-full px-8 py-10 flex gap-8">
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-surface-container-low p-8 rounded-xl sticky top-28">
            <h2 className="font-headline text-xl font-bold mb-8 text-on-surface">Filters</h2>

            <div className="mb-8">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-3">
                Live Overview
              </label>
              <div className="space-y-3 text-sm text-on-surface-variant">
                <div className="flex items-center justify-between rounded-lg bg-surface-container-highest px-4 py-3">
                  <span>Potential matches</span>
                  <span className="font-bold text-on-surface">{potentialMatches.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-highest px-4 py-3">
                  <span>Received requests</span>
                  <span className="font-bold text-on-surface">{receivedRequests.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-container-highest px-4 py-3">
                  <span>Sent requests</span>
                  <span className="font-bold text-on-surface">{sentRequests.length}</span>
                </div>
              </div>
            </div>

            <button
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
              onClick={fetchMatches}
            >
              Refresh Discoveries
            </button>
          </div>
        </aside>

        <section className="flex-grow">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2 text-on-surface">Find Your Match</h1>
              <p className="text-on-surface-variant max-w-md font-medium">
                Discover experts ready to exchange knowledge. Connect with people who complement your growth.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container-low p-1 rounded-full">
              <button
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-primary'}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                Grid
              </button>
              <button
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-primary'}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                List
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl bg-error-container px-6 py-8 text-on-error-container">
              <h2 className="font-headline text-2xl font-bold mb-2">Unable to load matches</h2>
              <p className="font-medium">{error}</p>
            </div>
          ) : hasNoMatches ? (
            <div className="rounded-2xl bg-surface-container-low px-6 py-10 text-center flex flex-col items-center">
              <h2 className="font-headline text-2xl font-bold mb-2 text-on-surface">No matches found</h2>
              <p className="text-on-surface-variant font-medium mb-6">Update your skills or broaden your search.</p>
              <button
                onClick={() => navigate('/profile-settings')}
                className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-dim transition-colors flex items-center gap-2"
                aria-label="Update profile to find more matches"
              >
                <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                Update Profile
              </button>
            </div>
          ) : (
            <>
              <div className={gridClass}>
                {featuredMatch && (
                  <motion.div
                    className="xl:col-span-2 relative group overflow-hidden rounded-xl bg-surface-container-highest p-1 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-10"></div>
                    <div className="relative bg-surface-container-lowest p-8 rounded-[1.25rem] flex flex-col md:flex-row gap-8 items-center border border-primary/10">
                      <div className="relative w-48 h-48 flex-shrink-0">
                        <div className="absolute -inset-2 bg-secondary-fixed opacity-20 rounded-full blur-xl animate-pulse"></div>
                        <img
                          src={featuredMatch.avatar}
                          alt={featuredMatch.username}
                          className="w-full h-full object-cover rounded-full border-4 border-white relative z-10"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest z-20 shadow-sm">
                          Featured
                        </div>
                      </div>

                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-headline text-2xl font-black text-on-surface">{featuredMatch.username}</h3>
                            <p className="font-label text-sm text-on-surface-variant font-semibold">
                              {featuredMatch.role || 'Senior Contributor'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-primary">
                              {featuredMatch.matchScore ?? featuredMatch.compatibilityScore ?? 0}%
                            </div>
                            <div className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                              Match Score
                            </div>
                          </div>
                        </div>

                        <p className="text-on-surface-variant mb-6 text-sm leading-relaxed max-w-2xl font-medium">
                          {featuredMatch.bio}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-8">
                          {ensureArray(featuredMatch.skillsOffered).map((skill) => (
                            <span key={skill} className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-4">
                          <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-lg font-bold shadow-md hover:scale-[1.02] transition-transform">
                            Connect Now
                          </button>
                          <button className="bg-surface-container-high text-primary px-8 py-3 rounded-lg font-bold hover:bg-surface-container-highest transition-colors">
                            View Portfolio
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {matches.map((match, index) => (
                  <motion.div
                    key={match._id}
                    className="bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_24px_48px_rgba(48,41,80,0.08)] transition-all duration-300 group border border-transparent hover:border-outline-variant/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-surface-container-high shadow-sm">
                        <img src={match.avatar} alt={match.username} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-headline text-lg font-bold text-on-surface">{match.username}</h4>
                        <p className="text-xs text-on-surface-variant font-semibold">
                          {match.location?.city ? `${match.location.city}, ${match.location.country}` : 'Remote'}
                        </p>
                      </div>
                      <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-lg text-xs font-black">
                        {match.matchScore ?? match.compatibilityScore ?? 0}% Match
                      </div>
                    </div>

                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-6 font-medium">{match.bio}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {ensureArray(match.skillsOffered).map((skill) => (
                        <span key={skill} className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <button className="w-full py-3 rounded-lg bg-surface-container-low text-primary font-bold text-sm group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary-container group-hover:text-on-primary transition-all">
                      Request Swap
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  className="flex items-center gap-3 font-bold text-primary group hover:gap-4 transition-all"
                >
                  <span>Explore more matches</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="w-full mt-auto bg-surface-container-low border-none">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full gap-4 max-w-screen-2xl mx-auto">
          <div className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant order-2 md:order-1">
            © 2024 SkillSwap. The Kinetic Studio.
          </div>
          <div className="flex gap-8 order-1 md:order-2">
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Help Center</a>
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Matches;
