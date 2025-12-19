const mongoose = require('mongoose');
const { sanitizeHtml } = require('../utils/xss');

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeHtml(obj) : obj;
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    const value = obj[key];
    
    // Remove MongoDB operators (keys starting with $)
    if (typeof key === 'string' && key.startsWith('$')) {
      continue;
    }
    
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = typeof value === 'string' ? sanitizeHtml(value) : value;
    }
  }
  
  return sanitized;
};

const validateObjectId = (req, res, next) => {
  const params = ['id', 'userId', 'roomId', 'matchId', 'recipientId', 'revieweeId'];
  
  for (const param of params) {
    if (req.params[param] && !mongoose.isValidObjectId(req.params[param])) {
      return res.status(400).json({ success: false, errors: [`Invalid ${param}`] });
    }
    if (req.body[param] && !mongoose.isValidObjectId(req.body[param])) {
      return res.status(400).json({ success: false, errors: [`Invalid ${param}`] });
    }
  }
  
  next();
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

module.exports = {
  sanitizeInput,
  validateObjectId,
  sanitizeObject
};
