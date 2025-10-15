// src/controllers/authEnhancedController.js - Modified to return codes in responses
const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

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
          code: code // Return code for test
        });
      }
      updateData = { where: { email } };
    } else if (phoneNumber) {
      user = await prisma.user.findUnique({ where: { phoneNumber } });
      if (!user) {
        logger.warn('Verification code request for non-existent phone', { phoneNumber });
        return res.json({ 
          message: 'If the account exists, a verification code has been sent',
          code: code // Return code for test
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
    
    // لاگ ایمن به جای console.log
    logger.info('Verification code sent', {
      destination: email || phoneNumber,
      type: 'verification',
      codeLength: code.length
    });
    
    res.json({ 
      message: 'Verification code sent successfully',
      code: code, // Return code for test environments
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
      code: code // Return the verified code for test
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
          { email: email || '' }
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
      code: code, // Return code for test
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
      const resetCode = Math.floor(10000 + Math.random() * 90000).toString(); // Generate even if no user for consistency
      return res.json({ 
        message: 'If the account exists, a reset code has been sent',
        code: resetCode // Return code for test
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
      code: resetCode, // Return code for test
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
      code: code // Return the used code for test
    });
    
  } catch (err) {
    logger.error('Password reset failed', { error: err.message });
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode,
  registerWithPhone,
  forgotPassword,
  resetPassword
};