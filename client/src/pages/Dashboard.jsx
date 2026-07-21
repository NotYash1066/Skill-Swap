import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import Navbar from '../components/common/Navbar';
import { clearAuthState, notifyAuthStateChange } from '../utils/auth';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket] = useState(() => io(API_BASE_URL));
  const navigate = useNavigate();
  const memberSinceLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : 'Unknown';

  useEffect(() => {
    return () => socket.close();
  }, [socket]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/login');
        return;
      }

      const response = await axios.get(API_ENDPOINTS.AUTH.ME, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        clearAuthState();
        notifyAuthStateChange();
        navigate('/login');
        return;
      }
      setError('We could not load your profile right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
        <p className="ml-4 font-headline font-bold text-on-surface animate-pulse" aria-live="polite">Loading your studio...</p>
      </div>
    );
  }

  const suggestedMatches = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      location: '2.4 miles away',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1EE8K3jtyP4rOVNAmCutQSBeKe2NiITzIino1gBKOXreR69rhrwS2Gs8lH7tyMjAVOa_q3X9IoWcaVWSR0MwCt8-kcay9frh-1osjMggm7KzU1X6kyR1z7dgdEh4Dk2WKe_rsT-KdTwfm_Ln2cCVcYVUFzqpyYl6ZCL04NYZzxAOsWz1JkpQkwoYmktTvibquMlEU8TZASKf8Pb-EWt5Yr-dcanGzxZpw-QYc2CBeEsSCy169cBIK1OU-aGeRmBSHxbAlTWMWBBg',
      offers: ['Jazz Piano', 'Music Theory'],
      wants: ['UI Design']
    },
    {
      id: 2,
      name: 'Marcus Thorne',
      location: 'Remote',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyTLJectrN-p3xUkE1EGegdPkOXUrupicK1Nr_DBMyAugvSxWnhvYGZvLseMuiWnXv4qxnbDMiYXk_jKur3Mu9fcGuP9O-stDxMjTsKpbxwN1p3Wscg1Oikh9k6SVc_cZBb8EKx_J5nPGkI3-aNCUzV7zcBFhFtdVvpLjagAER-moWeDj7rVAVPnW4_LRna43R0rNlozg8Y3Krnve5Qrh7xj8yb1B6eDUejLEAavFBV7eWsWrPgt8jZElKUhBVfxEWxPgKJa0UnJw',
      offers: ['French', 'Linguistics'],
      wants: ['Prototyping']
    }
  ];

  const communityAvatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDxDlVfyuhd-rkYNROnJ-8yKPVqoOXViUFzHm-xAc3m5539S2YWXqUyA7fM-JhLvNJjAGmUJG-eO3dJdbVK4-OezlZjtJS4y99fvwc9kK9nUlDalvK9Hjp_03Sl3-limQC99m5AmHqsB4zEa2igfAsioYTbgpzr8VIgcL8VVJT2COulq1NGv8tPmjWCdR4wgX5R9g3ySabvToUJXzYPx6EJaq6QQDQRxYuFnyURHsOJwLWOxlojTIZ6FZo-lBMXUMmx9yoLUDo9v-k',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAQtymTDWOSzJk7yEN4paMtBgK8p9ZBKxY3naD6AUQNDTHlcPG7A3EpWw_5A3c0pLsm0lySplNRFBHo8x1CSR9Ixl58gcFEC4tiCu0FJ8iuHwCibNTc9-2TDcIjCi18QiWC3L1NOKPjRUF86VZlDI9P0ZYOEauq1Rj4oqUJwCUnzWhPyW_-0ZzguYXcLTyirGferyVxMpG_GCu_McooLAiJypb5oz_Zlg8nj4bCS_ouUwE7YQtX7t0Rhnj-JM0ITy5pO7x76y72XEE',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBOl1a3BYxevAV_axcVm9fVE5C9rVJRCD260JI54bKzeQLZwHfjYiwv_cXd08ynFL3p7aYVhAoUVCjMDlsLKrITt9KPFHUn3-Kb8_Oo2FbUt-h1O2D_2OQi9luL-1ClJUlec2HXJQ6WfEvaarLuhqGXRuwOCeMga_joLdfhxcmKGwNczK1_yyO0F3HsA-MaVHx3W3iZa0K83iFK3VnfVcrlQfnXXE0g9c6Ue5ZpfniTELfxAwP59YdmMl0k4pIheG-94rGAEAoxw1s',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAlIcFAGrGxdL1IB9VvQ6l-Ys0Zv8YDoBiCZO0njP0tpMagwghvWTGADveeVj8L0FdhjJr_ZWf_axmtbXsBuQwA16CHetpqZ3DhrquA6UjXKYGkb2mRhFK_4_A6mZOajW8ehqpJEypgf-cgP2KPIKpAh29OwWxaF_zvnhH5FKESZirDXWrdXjmrDkpVwzDKkRGGhbIV8RoUVwjAweSbLHWc84MSyS8zuDapx3R99YR3UDHrEtPgA5JcGobbb8LgLFSD9fkmOHXhA4Y',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAqSvBVMlCIK_uJ5wLohCdFZpXaha9XKnK7GWj1dSvufljJhgvRutLdRWZuHfhTHxltxeFioO-4azPXbBcdvM9DNeIcOMkbeoOPjG01Zlb-_OeduKtDBoMmNm2ozJBFHRWdllfiu9nbz7Ncfl5c1IHWvSwXIz-az8xrjMSjZnzcuFAtFuoYT_zE4Kztu0i8LQP_rlnCv7bAWKpCIyR-kNJIMaoXJzhKClw_EPmEL1DQsG_1ZOBnGp36i_XgGpwj1xxJvEzAvU2s7VI'
  ];

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <Navbar user={user} socket={socket} />

      <main className="flex-grow max-w-screen-2xl mx-auto w-full px-8 py-10">
        {error && (
          <div className="mb-6 rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-4 space-y-8">
            <motion.div
              className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_30px_rgb(48,41,80,0.04)] relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h2 className="font-headline font-extrabold text-2xl tracking-tight mb-2">{user?.username}</h2>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  {user?.bio || 'Product Designer by day, aspiring Jazz pianist by night. Passionate about human-centric design.'}
                </p>
                <div className="space-y-4 font-label">
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    <span>{user?.location?.city ? `${user.location.city}, ${user.location.country}` : 'San Francisco, CA'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg">history</span>
                    <span>{memberSinceLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                    <span>Available: Weekends & Weeknights</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span>12 Successful Swaps</span>
                  </div>
                </div>
                <button
                  className="w-full mt-8 py-3 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform duration-200"
                  onClick={() => navigate('/profile-settings')}
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>

            <div className="space-y-6">
              <div>
                <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                  Skills I Offer
                  <span className="h-1 w-1 bg-secondary rounded-full"></span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(user?.skillsOffered?.length > 0 ? user.skillsOffered : ['UI Design', 'Prototyping', 'Figma', 'Branding', 'Adobe Suite']).map((skill) => (
                    <span key={skill} className="px-4 py-2 bg-secondary/10 text-secondary rounded-full font-label text-xs font-bold tracking-wide uppercase">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                  Skills I Want to Learn
                  <span className="h-1 w-1 bg-tertiary rounded-full"></span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(user?.skillsSought?.length > 0 ? user.skillsSought : ['Jazz Piano', 'Cooking Thai', 'React.js', 'French']).map((skill) => (
                    <span key={skill} className="px-4 py-2 bg-tertiary/10 text-tertiary rounded-full font-label text-xs font-bold tracking-wide uppercase">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-10">
            <motion.section
              className="bg-surface-container-low rounded-[2rem] p-10 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="max-w-lg relative z-10">
                <h1 className="font-headline font-extrabold text-5xl tracking-tight text-on-surface mb-4">
                  Hello, {user?.username?.split(' ')[0] ?? 'there'}!
                </h1>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                  Ready for your next learning adventure? There are 24 new potential matches looking for your skills today.
                </p>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-dim transition-colors" onClick={() => navigate('/matches')}>
                    Start a Swap
                  </button>
                  <button className="px-8 py-3 bg-surface-container-highest text-primary rounded-lg font-bold hover:bg-surface-variant transition-colors" onClick={() => navigate('/matches?tab=requests')}>
                    View Requests
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block">
                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-l-full opacity-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[8rem] text-primary/20 rotate-12">swap_calls</span>
                </div>
              </div>
            </motion.section>

            <section>
              <h3 className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest mb-6 px-2">Community Pulsing</h3>
              <div className="flex items-center -space-x-4 overflow-x-auto py-4 scrollbar-hide">
                {communityAvatars.map((url, index) => (
                  <div key={index} className="h-16 w-16 rounded-full border-4 border-surface ring-2 ring-primary-container/30 overflow-hidden shrink-0">
                    <img src={url} alt="Member" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="flex items-center justify-center h-16 w-16 rounded-full border-4 border-surface bg-surface-container-highest shrink-0 z-10">
                  <span className="text-primary font-bold text-sm">+89</span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Suggested Matches</h2>
                <Link to="/matches" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suggestedMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    className="bg-surface-container-lowest rounded-xl p-6 group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 shadow-sm">
                        <img src={match.avatar} alt={match.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-lg leading-tight group-hover:text-primary transition-colors">{match.name}</h4>
                        <div className="flex items-center gap-1 text-on-surface-variant text-xs font-label">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {match.location}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">Offers</span>
                        <div className="flex flex-wrap gap-1">
                          {match.offers.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">Wants</span>
                        <div className="flex flex-wrap gap-1">
                          {match.wants.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-6 py-2 border-2 border-primary/10 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary text-primary font-bold rounded-lg text-xs transition-all duration-300" onClick={() => navigate(`/matches?user=${match.id}`)}>
                      Connect
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full mt-auto bg-surface-container-low border-none">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full gap-4 max-w-screen-2xl mx-auto">
          <p className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            © 2024 SkillSwap. The Kinetic Studio.
          </p>
          <div className="flex gap-8">
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Help Center</a>
            <a className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Community Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
