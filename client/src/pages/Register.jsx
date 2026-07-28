import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import { notifyAuthStateChange, storeAuthTokens } from '../utils/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (password !== confirmPassword) {
      setErrors([{ msg: 'Passwords do not match' }]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.REGISTER, {
        username,
        email,
        password
      });

		storeAuthTokens({ token: res.data.token, refreshToken: res.data.refreshToken });
		notifyAuthStateChange();
		navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([{ msg: 'Registration failed. Please try again.' }]);
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

        <div className="w-full max-w-[1100px] grid md:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(48,41,80,0.12)] bg-surface-container-lowest relative z-10">
          {/* Branding Side */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary-container text-on-primary">
            <div>
              <span className="text-2xl font-black tracking-tighter text-on-primary">SkillSwap</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">Start Your Journey.</h1>
              <p className="text-on-primary/80 text-lg max-w-sm font-medium">Join the world's most energetic community of learners and mentors. Swap skills, build projects, grow together.</p>
            </div>
            <div className="flex -space-x-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-sm">+2k</div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Create Account</h2>
              <p className="text-on-surface-variant font-medium">Join thousands swapping expertise daily.</p>
            </div>

            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                {errors[0].msg}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Username</label>
                <div className="relative">
                  <input 
                    className="w-full px-5 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all" 
                    name="username"
                    value={username}
                    onChange={onChange}
                    placeholder="johndoe" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    className="w-full px-5 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all" 
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    placeholder="name@example.com" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Password</label>
                <div className="relative">
                  <input 
                    className="w-full px-5 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all" 
                    type="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="••••••••" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    className="w-full px-5 py-3 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all" 
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    placeholder="••••••••" 
                    required
                  />
                </div>
              </div>

              <button 
                className={`w-full bg-gradient-to-br from-primary to-primary-container py-4 rounded-xl text-on-primary font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-on-surface-variant font-medium">Already have an account? 
                <Link className="text-primary font-bold ml-1 hover:underline underline-offset-4" to="/login">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
