import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import { notifyAuthStateChange } from '../utils/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password
      });

      localStorage.setItem('token', res.data.token);
      notifyAuthStateChange();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (!err.response || err.response.status !== 400) {
        console.error('Login error:', err);
      }
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([{ msg: 'Login failed. Please try again.' }]);
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        {/* Background Organic Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-surface-container-high rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-secondary-container rounded-full blur-[100px] opacity-40"></div>

        {/* Login Container */}
        <motion.div 
          className="w-full max-w-[1100px] grid md:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(48,41,80,0.12)] bg-surface-container-lowest relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Branding/Visual Side */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary-container text-on-primary">
            <div>
              <span className="text-2xl font-black tracking-tighter text-on-primary">SkillSwap</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">The Kinetic Studio of Knowledge.</h1>
              <p className="text-on-primary/80 text-lg max-w-sm font-medium">Connect with mentors, swap skills, and grow your expertise in a collaborative fluid environment.</p>
            </div>
            <div className="flex -space-x-3">
              <img className="w-12 h-12 rounded-full border-4 border-primary object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0vnMJjVWOBTDNfcSp_9_nPQmcFdjWurIS4vV8W1oHme-fWUMzyYkQFPlsBEj6-9aTqWVLp2eWS20fDz2PoLPqII43rF4MgE7lGMZvXEbHAccqLuEXtc9tNwIKeTRp26k9CJ4gau1_sIH8KJ9Kfz9Zzusi_cPG7N9Bo9P1XU-sBjqZVuv1ZXjd9jLDGmzvYINMDIhXTmLP8ei8WU8eEKfNyvQeH6jzhpU6Pc38VBfnDio1HL4TloiFISVPY7IkYG7oOTqDmlvagFg" alt="User 1" />
              <img className="w-12 h-12 rounded-full border-4 border-primary object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxMyfLYKfoeC4dCEikDAQVRNpLYv0I_PlhQ1-5DdtdJoNpHN4ztGEX5qzbq6-cLHK8BF6EojONM-gWuSGBdHwlFz-CLrOR7GHXlfe3cjxp9zxMXzqYpPk3T-YpXShHYO-ohDKHGR6ScBtbcxcxM2J9SLH06oIDZs3pY9SfIbLDlIz5N0wypjMNbnw4nf0RUO4zG7P75GopjxEDGpXrcbDDmDzOgOIitdLIxq710sNV0VI4CK6ChGNDF5S06Dl8pb_6Z-i1PL_VzeY" alt="User 2" />
              <img className="w-12 h-12 rounded-full border-4 border-primary object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh0-2zORrjA04CKfrOrMKL0W2lrJgv_GZ3DFof1khLQIG24wSSo21Q4IUwnifT-O0BkdMFpazhxi4urKqsZgytFF4M4ve82Zi8dNysn_LCfR3ZD8xPiAvSl7doG85Ei5gBJ84sFi1cT7rDN_5ENcd22Qdn3S2J5pnttqBw3l6ssE8Ai90cpLjxnrcz1f0oiKRk7TcnNURzWf5AOpKieGDwLdPTO7BE83C0xIjv4tzD-En7DSPdyFOK5PkfEZNZvknH5TsdT5G_MLo" alt="User 3" />
              <div className="w-12 h-12 rounded-full border-4 border-primary bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-sm">+2k</div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Welcome to SkillSwap</h2>
              <p className="text-on-surface-variant font-medium">Enter your credentials to access your studio.</p>
            </div>

            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                {errors[0].msg}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="login-email" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Email Address</label>
                <div className="relative input-container">
                  <input 
                    id="login-email"
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all" 
                    placeholder="name@company.com" 
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                  />
                  <div className="input-focus-line absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 transition-transform origin-center"></div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="login-password" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
                  <a className="font-label text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-dim transition-colors" href="#">Forgot Password?</a>
                </div>
                <div className="relative input-container">
                  <input 
                    id="login-password"
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                  />
                  <div className="input-focus-line absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 transition-transform origin-center"></div>
                </div>
              </div>

              <button 
                className={`w-full bg-gradient-to-br from-primary to-primary-container py-4 rounded-xl text-on-primary font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-10 flex items-center">
              <div className="flex-grow border-t border-surface-container-high"></div>
              <span className="px-4 font-label text-[10px] font-bold uppercase tracking-widest text-outline text-center">Or continue with</span>
              <div className="flex-grow border-t border-surface-container-high"></div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface font-semibold text-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface font-semibold text-sm">
                <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
                LinkedIn
              </button>
            </div>

            <div className="mt-12 text-center">
              <p className="text-on-surface-variant font-medium">New to SkillSwap? 
                <Link className="text-primary font-bold ml-1 hover:underline underline-offset-4" to="/register">Create an account</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-low border-none flex flex-col md:flex-row justify-between items-center px-8 py-12 gap-4">
        <div className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity text-center md:text-left">
          © 2024 SkillSwap. The Kinetic Studio.
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-widest hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-widest hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          <a className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-widest hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Help Center</a>
          <a className="text-on-surface-variant font-label text-xs font-semibold uppercase tracking-widest hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#">Community Guidelines</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
