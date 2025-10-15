const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtConfig } = require('../config/jwt');

const authMiddleware = (roles = []) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.accessSecret);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    // چک کردن roles اگر مشخص شده باشه
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authMiddleware };