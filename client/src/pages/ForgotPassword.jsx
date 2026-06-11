import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from '../lib/motion';
import { API_ENDPOINTS } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setSuccessMessage(res.data?.msg || 'If an account exists, a reset email has been sent.');
    } catch (err) {
      if (err.response?.data?.errors?.length > 0) {
        setError(err.response.data.errors[0].msg);
      } else if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('We could not send a reset email right now. Please try again.');
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
              <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">Reset your password.</h1>
              <p className="text-on-primary/80 text-lg max-w-sm font-medium">Enter your email address and we will send you a secure link to create a new password.</p>
            </div>
            <div className="text-sm font-label font-semibold uppercase tracking-[0.2em] text-on-primary/80">
              Secure access, back in motion.
            </div>
          </div>

          <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Forgot Password</h2>
              <p className="text-on-surface-variant font-medium">We&apos;ll email you a reset link if your account exists.</p>
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
                <label htmlFor="forgot-password-email" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant block ml-1">Email Address</label>
                <div className="relative input-container">
                  <input
                    id="forgot-password-email"
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-0 transition-all"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-10 text-center space-y-3">
              <p className="text-on-surface-variant font-medium">
                Remembered it?
                <Link className="text-primary font-bold ml-1 hover:underline underline-offset-4" to="/login">Back to Sign In</Link>
              </p>
              <p className="text-on-surface-variant font-medium">
                Need an account?
                <Link className="text-primary font-bold ml-1 hover:underline underline-offset-4" to="/register">Create one</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ForgotPassword;
