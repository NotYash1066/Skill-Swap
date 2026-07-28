const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const getUserId = (user) => {
  const id = user.id || user._id || user;
  return typeof id === 'string' ? id : id?.toString();
};
const getTokenVersion = (user) => user.tokenVersion || 0;

const createTokenPayload = (user) => ({
  user: {
    id: getUserId(user),
    tokenVersion: getTokenVersion(user),
  },
});

const generateAccessToken = (user) => {
  return jwt.sign(createTokenPayload(user), process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { ...createTokenPayload(user), jti: crypto.randomBytes(16).toString('hex') },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { createTokenPayload, generateAccessToken, generateRefreshToken };
