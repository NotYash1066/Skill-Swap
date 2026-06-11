import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from '../lib/motion';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigateTimerRef = useRef(null);

  // Clear the delayed-navigation timer on unmount
  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        window.clearTimeout(navigateTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put(API_ENDPOINTS.AUTH.RESET_PASSWORD(token), {
        password: formData.password
      });

      setSuccessMessage(res.data?.message || 'Password reset successful. Redirecting to sign in...');
      setFormData({ password: '', confirmPassword: '' });

      navigateTimerRef.current = window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      if (err.response?.data?.errors?.length > 0) {
        setError(err.response.data.errors[0].msg);
      } else if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('We could not reset your password right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-surface-container-high rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-secondary-container rounded-full blur-[100px] opacity-40"></div>

        <motion.div
          className="w-full max-w-[1100px] grid md:grid-cols-2 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(48,41,80,0.12)] bg-surface-container-lowest relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary-container text-on-primary">
            <div>
              <span className="text-2xl font-black tracking-tighter text-on-primary">SkillSwap</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">Create a new password.</h1>
              <p className="text-on-primary/80 text-lg max-w-sm font-medium">Choose a new password for your account to get back into your studio securely.</p>
            </div>
            <div className="text-sm font-label font-semibold uppercase tracking-[0.2em] text-on-primary/80">
              Token-verified access recovery.
            </div>
          </div>

          <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Reset Password</h2>
              <p className="text-on-surface-variant font-medium">Your new password must include uppercase, lowercase, and a number.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-secondary-container text-on-surface rounded-xl text-sm font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="reset-password-password" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">New Password</label>
                <div className="relative input-container">
                  <input
                    id="reset-password-password"
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                    placeholder="••••••••"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <div className="input-focus-line absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 transition-transform origin-center"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-password-confirm-password" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Confirm New Password</label>
                <div className="relative input-container">
                  <input
                    id="reset-password-confirm-password"
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                    placeholder="••••••••"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-on-surface-variant font-medium">
                Back to
                <Link className="text-primary font-bold ml-1 hover:underline underline-offset-4" to="/login">Sign In</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;
