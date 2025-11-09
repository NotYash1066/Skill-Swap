const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ success: false, errors: ['No token, authorization denied'] });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, errors: ['Token is not valid'] });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, errors: ['Token expired'] });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, errors: ['Invalid token'] });
    }
    return res.status(401).json({ success: false, errors: ['Authentication failed'] });
  }
};

module.exports = auth;
