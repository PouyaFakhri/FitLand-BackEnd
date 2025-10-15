const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/jwt');

const generateAccessToken = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, jwtConfig.accessSecret, { expiresIn: jwtConfig.accessExpire });
};

const generateRefreshToken = (userId, tokenId) => {
  const payload = { id: userId, tokenId };
  return jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpire });
};

const verifyAccessToken = (token) => jwt.verify(token, jwtConfig.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, jwtConfig.refreshSecret);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};