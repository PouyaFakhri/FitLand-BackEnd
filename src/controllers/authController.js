const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");
const logger = require("../utils/logger");

const COOKIE_NAME = 'refreshToken';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});

// تابع کمکی برای گرفتن IP کاربر
const getClientIp = (req) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    "unknown";

  return ip === "::1" ? "127.0.0.1" : ip;
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
      return res.status(400).json({ message: "آدرس ایمیل معتبر نیست" });
    }

    // بررسی وجود کاربر
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      logger.warn("Registration attempt with existing email", { email });
      return res.status(409).json({ message: "Email already exists" });
    }

    // هش کردن رمز عبور
    const hashed = await bcrypt.hash(password, 10);

    // ایجاد کاربر
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase(),
        password: hashed,
      },
    });

    logger.info("User registered successfully", { userId: user.id, email });

    res.status(201).json({
      message: "User registered",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    logger.error("Registration failed", { error: err.message });
    res.status(500).json({ message: "Internal server error" });
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
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logger.warn("Login attempt with non-existent email", { email });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn("Login attempt with invalid password", {
        email,
        userId: user.id,
      });
      return res.status(401).json({ message: "Invalid credentials" });
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
        device: device || req.headers["user-agent"] || null,
        ip: clientIp,
        expiresAt,
        userId: user.id,
      },
    });

    // ست کردن cookie
    res.cookie(COOKIE_NAME, rawRefresh, cookieOptions());

    logger.info("User logged in successfully", { userId: user.id, email });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error("Login failed", { error: err.message });
    res.status(500).json({ message: "Internal server error" });
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
      return res.status(403).json({ message: "No refresh token" });
    }

    // بررسی توکن
    let payload;
    try {
      payload = verifyRefreshToken(raw);
    } catch (verifyErr) {
      logger.warn("Refresh token verification failed", {
        error: verifyErr.message,
      });
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { id: userId, tokenId } = payload;

    // پیدا کردن توکن در دیتابیس
    const stored = await prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });
    if (!stored) {
      logger.warn("Refresh token not found in database", { tokenId, userId });
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // بررسی انقضا و لغو شدن
    if (stored.revoked || stored.expiresAt < new Date()) {
      logger.warn("Refresh token expired or revoked", { tokenId, userId });
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // بررسی تطابق هش
    const match = await bcrypt.compare(raw, stored.tokenHash);
    if (!match) {
      // در صورت عدم تطابق، تمام توکن‌های کاربر باطل شوند
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });

      logger.warn(`Refresh token reuse detected`, {
        userId,
        tokenId,
        ip: getClientIp(req),
      });

      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(403).json({ message: "Invalid refresh token" });
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
          userId,
          ip: getClientIp(req),
          device: req.headers["user-agent"] || null,
        },
      }),
      prisma.refreshToken.update({
        where: { id: tokenId },
        data: {
          revoked: true,
          replacedById: newTokenId,
        },
      }),
    ]);

    // پیدا کردن کاربر و تولید access token جدید
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      logger.error("User not found during token refresh", { userId });
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken(user);

    // ست کردن cookie جدید
    res.cookie(COOKIE_NAME, newRaw, cookieOptions());

    logger.info("Token refreshed successfully", { userId });

    res.json({
      accessToken,
      user,
    });
  } catch (err) {
    logger.error("Refresh failed", { error: err.message });
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.status(403).json({ message: "Invalid refresh token" });
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
          await prisma.refreshToken
            .update({
              where: { id: payload.tokenId },
              data: { revoked: true },
            })
            .catch(() => {
              // اگر توکن پیدا نشد، ادامه دهید
            });
        }
      } catch (e) {
        // اگر JWT غلط بود، ادامه دهید
      }
    }

    res.clearCookie(COOKIE_NAME, { path: "/" });

    logger.info("User logged out", { userId: req.user?.id });

    res.json({ message: "Logged out" });
  } catch (e) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    logger.error("Logout error", { error: e.message });
    res.json({ message: "Logged out" });
  }
};

/**
 * @swagger
 * /api/auth/send-verification:
 *   post:
 *     summary: Send verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 */
const sendVerificationCode = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }
    
    // تولید کد ۵ رقمی
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 دقیقه
    
    let user;
    let updateData = {};
    
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        logger.warn('Verification code request for non-existent email', { email });
        return res.json({ 
          message: 'If the account exists, a verification code has been sent',
          code: process.env.NODE_ENV === 'development' ? code : undefined
        });
      }
      updateData = { where: { email } };
    } else if (phoneNumber) {
      user = await prisma.user.findUnique({ where: { phoneNumber } });
      if (!user) {
        logger.warn('Verification code request for non-existent phone', { phoneNumber });
        return res.json({ 
          message: 'If the account exists, a verification code has been sent',
          code: process.env.NODE_ENV === 'development' ? code : undefined
        });
      }
      updateData = { where: { phoneNumber } };
    }
    
    // آپدیت کاربر با کد تایید
    await prisma.user.update({
      ...updateData,
      data: { 
        verificationCode: code, 
        verificationCodeExpires: expiresAt 
      }
    });
    
    // لاگ ایمن
    logger.info('Verification code sent', {
      destination: email || phoneNumber,
      type: 'verification',
      codeLength: code.length
    });
    
    res.json({ 
      message: 'Verification code sent successfully',
      code: process.env.NODE_ENV === 'development' ? code : undefined,
      expiresIn: '2 minutes'
    });
    
  } catch (err) {
    logger.error('Send verification code failed', { error: err.message });
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               code:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 5
 *     responses:
 *       200:
 *         description: Code verified successfully
 */
const verifyCode = async (req, res) => {
  try {
    const { email, phoneNumber, code } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }
    
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phoneNumber) {
      user = await prisma.user.findUnique({ where: { phoneNumber } });
    }
    
    if (!user) {
      logger.warn('Verification attempt for non-existent user', { email, phoneNumber });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // بررسی انقضا و تطابق کد
    if (!user.verificationCode || user.verificationCode !== code) {
      logger.warn('Invalid verification code attempt', { 
        userId: user.id, 
        providedCode: code 
      });
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    if (user.verificationCodeExpires < new Date()) {
      logger.warn('Expired verification code attempt', { userId: user.id });
      return res.status(400).json({ message: 'Verification code expired' });
    }
    
    // علامت‌گذاری کاربر به عنوان تأیید شده
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
      }
    });
    
    logger.info('User verified successfully', { userId: user.id });
    res.json({ 
      message: 'Account verified successfully',
      verified: true
    });
    
  } catch (err) {
    logger.error('Verify code failed', { error: err.message });
    res.status(500).json({ message: 'Failed to verify code' });
  }
};

/**
 * @swagger
 * /api/auth/register-phone:
 *   post:
 *     summary: Register with phone number
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
 *               - phoneNumber
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: User registered successfully
 */
const registerWithPhone = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email } = req.body;
    
    // بررسی وجود کاربر
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          ...(email ? [{ email }] : [])
        ]
      }
    });
    
    if (existingUser) {
      logger.warn('Duplicate registration attempt', { phoneNumber, email });
      return res.status(409).json({ 
        message: 'User with this phone or email already exists' 
      });
    }
    
    // تولید رمز عبور موقت
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // ایجاد کاربر
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        firstName,
        lastName,
        phoneNumber,
        email: email || null,
        password: hashedPassword,
        isVerified: false
      }
    });
    
    // ارسال کد تایید
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 دقیقه
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationCode: code, 
        verificationCodeExpires: expiresAt 
      }
    });
    
    logger.info('User registered with phone', { 
      userId: user.id, 
      phoneNumber,
      verificationCodeLength: code.length 
    });
    
    res.status(201).json({
      message: 'User registered. Verification code sent.',
      userId: user.id,
      verificationRequired: true,
      code: process.env.NODE_ENV === 'development' ? code : undefined,
      expiresIn: '2 minutes'
    });
    
  } catch (err) {
    logger.error('Phone registration failed', { error: err.message });
    res.status(500).json({ message: 'Failed to register user' });
  }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code sent if account exists
 */
const forgotPassword = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }
    
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phoneNumber) {
      user = await prisma.user.findUnique({ where: { phoneNumber } });
    }
    
    if (!user) {
      // برای امنیت، همیشه پیام یکسان برگردانید
      logger.info('Password reset request for non-existent account', { email, phoneNumber });
      const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
      return res.json({ 
        message: 'If the account exists, a reset code has been sent',
        code: process.env.NODE_ENV === 'development' ? resetCode : undefined
      });
    }
    
    // تولید کد بازیابی
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 دقیقه
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationCode: resetCode, 
        verificationCodeExpires: expiresAt 
      }
    });
    
    logger.info('Password reset code sent', { 
      userId: user.id, 
      destination: email || phoneNumber 
    });
    
    res.json({ 
      message: 'If the account exists, a reset code has been sent',
      code: process.env.NODE_ENV === 'development' ? resetCode : undefined,
      expiresIn: '2 minutes'
    });
    
  } catch (err) {
    logger.error('Forgot password failed', { error: err.message });
    res.status(500).json({ message: 'Failed to process reset request' });
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               code:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 5
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
const resetPassword = async (req, res) => {
  try {
    const { email, phoneNumber, code, newPassword } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }
    
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phoneNumber) {
      user = await prisma.user.findUnique({ where: { phoneNumber } });
    }
    
    if (!user) {
      logger.warn('Password reset attempt for non-existent user', { email, phoneNumber });
      return res.status(404).json({ message: 'User not found' });
    }
    
    // بررسی کد
    if (!user.verificationCode || user.verificationCode !== code) {
      logger.warn('Invalid reset code attempt', { userId: user.id });
      return res.status(400).json({ message: 'Invalid reset code' });
    }
    
    if (user.verificationCodeExpires < new Date()) {
      logger.warn('Expired reset code attempt', { userId: user.id });
      return res.status(400).json({ message: 'Reset code expired' });
    }
    
    // آپدیت رمز عبور
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        verificationCode: null,
        verificationCodeExpires: null
      }
    });
    
    logger.info('Password reset successful', { userId: user.id });
    res.json({ 
      message: 'Password reset successfully',
      success: true
    });
    
  } catch (err) {
    logger.error('Password reset failed', { error: err.message });
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  sendVerificationCode,
  verifyCode,
  registerWithPhone,
  forgotPassword,
  resetPassword
};