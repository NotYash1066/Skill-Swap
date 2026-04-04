import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from '../NotificationBell';
import { clearAuthState, notifyAuthStateChange } from '../../utils/auth';

const Navbar = ({ user, socket }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (token || refreshToken) {
        await axios.post(
          API_ENDPOINTS.AUTH.LOGOUT,
          { refreshToken },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuthState();
      notifyAuthStateChange();
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="w-full top-0 sticky bg-background z-50 shadow-[0_24px_24px_rgba(48,41,80,0.04)]">
      <div className="flex items-center justify-between px-8 py-4 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center gap-12">
          <Link to="/dashboard" className="text-2xl font-black tracking-tighter text-primary">SkillSwap</Link>
          <nav className="hidden md:flex items-center gap-8 font-headline font-medium text-sm tracking-tight">
            <Link 
              to="/dashboard" 
              className={`${path === '/dashboard' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/matches" 
              className={`${path === '/matches' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
            >
              Matches
            </Link>
            <Link 
              to="/chat" 
              className={`${path === '/chat' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
            >
              Chat
            </Link>
            <Link 
              to="/profile-settings" 
              className={`${path === '/profile-settings' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
            >
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-surface-container-high rounded-full px-4 py-2 gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-on-surface-variant text-on-surface" 
              placeholder="Search skills or mentors..." 
              type="text"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationBell socket={socket} />
            <ThemeToggle />
            <button 
              className="p-2 hover:bg-surface-container-low rounded-lg transition-all duration-200 text-on-surface-variant"
              onClick={() => navigate('/profile-settings')}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button 
              className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors ml-2"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div 
            className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary-container/20 cursor-pointer"
            onClick={() => navigate('/profile-settings')}
          >
            <img 
              src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBl--YtWmX98LLMck0EYYnR9DzbxP_k4y55ka50_eYnKoTO98BKskSPdUlZyQFOVe7f7KQrLK84N9FQysWNcYt7i5rdRirRYqcMOff8qYUEFIVun-55QJn2T_JZA48c7AUOSrb91W0ZuXUPdyOGUAGxS9Z6vF81uny9STW8rxueiKg2u5CfqopYPY--eWaqpStGE04YW9iFFeqVWbQ_Ot16uXH1nBmQSiHNpRZRlg2TTurR3LqABLvEkWFjhAJ3ifc5oGc9zycOdHk"} 
              alt="User Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
