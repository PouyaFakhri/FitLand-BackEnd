require('dotenv').config();

const jwtConfig = {
  accessSecret: process.env.ACCESS_SECRET || 'dev_access_secret',
  refreshSecret: process.env.REFRESH_SECRET || 'dev_refresh_secret',
  accessExpire: process.env.ACCESS_EXPIRE || '15m',
  refreshExpire: process.env.REFRESH_EXPIRE || '7d',
};

module.exports = { jwtConfig };