const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const logger = require('../utils/logger');

const COOKIE_NAME = 'refreshToken';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// تابع کمکی برای گرفتن IP کاربر
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }
  
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         req.ip ||
         req.headers['x-real-ip'] || // اضافه برای proxy
         'unknown';
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'آدرس ایمیل معتبر نیست' });
    }

    // بررسی وجود کاربر
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // هش کردن رمز عبور
    const hashed = await bcrypt.hash(password, 10);
    
    // ایجاد کاربر
    const user = await prisma.user.create({ 
      data: { 
        id: uuidv4(), 
        firstName, 
        lastName, 
        email, 
        password: hashed 
      } 
    });

    logger.info('User registered successfully', { userId: user.id, email });

    res.status(201).json({ 
      message: 'User registered', 
      user: { id: user.id, email: user.email } 
    });
  } catch (err) {
    logger.error('Registration failed', { error: err.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               device:
 *                 type: string
 *                 example: "Chrome on Windows"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abc123; HttpOnly; Path=/; Max-Age=604800
 *       401:
 *         description: Invalid credentials
 */
const login = async (req, res) => {
  try {
    const { email, password, device } = req.body;
    
    // پیدا کردن کاربر
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email, userId: user.id });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // تولید توکن‌ها
    const accessToken = generateAccessToken(user);
    const tokenId = uuidv4();
    const rawRefresh = generateRefreshToken(user.id, tokenId);
    const tokenHash = await bcrypt.hash(rawRefresh, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // گرفتن IP کاربر
    const clientIp = getClientIp(req);

    // ذخیره refresh token
    await prisma.refreshToken.create({ 
      data: { 
        id: tokenId, 
        tokenHash, 
        device: device || req.headers['user-agent'] || null, 
        ip: clientIp, 
        expiresAt, 
        userId: user.id 
      } 
    });

    // ست کردن cookie
    res.cookie(COOKIE_NAME, rawRefresh, cookieOptions());
    
    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({ accessToken });
  } catch (err) {
    logger.error('Login failed', { error: err.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       403:
 *         description: Invalid refresh token
 */
const refresh = async (req, res) => {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw) {
      return res.status(403).json({ message: 'No refresh token' });
    }

    // بررسی توکن
    let payload;
    try {
      payload = verifyRefreshToken(raw);
    } catch (verifyErr) {
      logger.warn('Refresh token verification failed', { error: verifyErr.message });
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { id: userId, tokenId } = payload;
    
    // پیدا کردن توکن در دیتابیس
    const stored = await prisma.refreshToken.findUnique({ where: { id: tokenId } });
    if (!stored) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // بررسی انقضا و لغو شدن
    if (stored.revoked || stored.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // بررسی تطابق هش
    const match = await bcrypt.compare(raw, stored.tokenHash);
    if (!match) {
      // در صورت عدم تطابق، تمام توکن‌های کاربر باطل شوند
      await prisma.refreshToken.updateMany({ 
        where: { userId }, 
        data: { revoked: true } 
      });
      
      logger.warn(`Refresh token reuse detected`, { 
        userId, 
        tokenId, 
        ip: getClientIp(req) 
      });

      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // تولید توکن جدید (Rotation)
    const newTokenId = uuidv4();
    const newRaw = generateRefreshToken(userId, newTokenId);
    const newHash = await bcrypt.hash(newRaw, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ذخیره توکن جدید و باطل کردن توکن قدیمی
    await prisma.$transaction([
      prisma.refreshToken.create({ 
        data: { 
          id: newTokenId, 
          tokenHash: newHash, 
          userId 
        } 
      }),
      prisma.refreshToken.update({ 
        where: { id: tokenId }, 
        data: { 
          revoked: true, 
          replacedById: newTokenId 
        } 
      })
    ]);

    // پیدا کردن کاربر و تولید access token جدید
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const accessToken = generateAccessToken(user);

    // ست کردن cookie جدید
    res.cookie(COOKIE_NAME, newRaw, cookieOptions());
    
    logger.info('Token refreshed successfully', { userId });

    res.json({ accessToken });
  } catch (err) {
    // هندل کردن خطاهای JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      logger.warn('Refresh token invalid', { error: err.message });
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    logger.error('Refresh failed', { error: err.message });
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out"
 */
const logout = async (req, res) => {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    
    if (raw) {
      try {
        const payload = verifyRefreshToken(raw);
        if (payload && payload.tokenId) {
          await prisma.refreshToken.update({ 
            where: { id: payload.tokenId }, 
            data: { revoked: true } 
          });
        }
      } catch (e) {
        // ignore verification errors during logout
      }
    }
    
    res.clearCookie(COOKIE_NAME);
    
    logger.info('User logged out', { userId: req.user?.id });

    res.json({ message: 'Logged out' });
  } catch (e) {
    // در صورت خطا همچنان cookie پاک شود
    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Logged out' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout
};