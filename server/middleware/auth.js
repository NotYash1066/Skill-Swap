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
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ success: false, errors: ['Token is not valid'] });
  }
};

module.exports = auth;
