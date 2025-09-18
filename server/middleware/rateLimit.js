const rateLimit = require('express-rate-limit');

// Create different rate limiters for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
  message: {
    success: false,
    errors: ['Too many authentication attempts. Please try again in 15 minutes.']
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for general API
  message: {
    success: false,
    errors: ['Too many requests. Please try again in 15 minutes.']
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const skillsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit skill updates to prevent spam
  message: {
    success: false,
    errors: ['Too many skill updates. Please try again in 5 minutes.']
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  skillsLimiter
};