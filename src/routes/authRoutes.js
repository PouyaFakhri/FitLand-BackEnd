const express = require('express');
const { 
  register,
  login,
  refresh,
  logout,
  sendVerificationCode,
  verifyCode,
  registerWithPhone,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { validate } = require('../utils/validation');
const { 
  userRegistrationSchema, 
  userLoginSchema,
  sendVerificationCodeSchema, // تغییر از sendCodeSchema به sendVerificationCodeSchema
  verifyCodeSchema,
  registerWithPhoneSchema,
  resetPasswordSchema
} = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: سیستم احراز هویت - Authentication System
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: ثبت‌نام کاربر جدید
 *     description: ایجاد حساب کاربری جدید با ایمیل و رمز عبور
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
 *                 example: "علی"
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 example: "محمدی"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "Password123"
 *     responses:
 *       201:
 *         description: کاربر با موفقیت ثبت‌نام شد
 *       409:
 *         description: ایمیل از قبل وجود دارد
 */
router.post('/register', validate(userRegistrationSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: ورود کاربر
 *     description: ورود به سیستم با ایمیل و رمز عبور
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
 *                 example: "Password123"
 *               device:
 *                 type: string
 *                 example: "Chrome on Windows"
 *     responses:
 *       200:
 *         description: ورود موفقیت‌آمیز
 *       401:
 *         description: اطلاعات نامعتبر
 */
router.post('/login', validate(userLoginSchema), login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: تازه‌سازی توکن دسترسی
 *     description: دریافت توکن دسترسی جدید با استفاده از refresh token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: توکن تازه‌سازی شد
 *       403:
 *         description: توکن نامعتبر
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: خروج کاربر
 *     description: خروج از سیستم و باطل کردن توکن‌ها
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: خروج موفقیت‌آمیز
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/send-verification:
 *   post:
 *     summary: ارسال کد تایید
 *     description: ارسال کد تایید به ایمیل یا شماره تلفن کاربر
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
 *                 example: "user@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "09123456789"
 *     responses:
 *       200:
 *         description: کد تایید با موفقیت ارسال شد
 */
router.post('/send-verification', validate(sendVerificationCodeSchema), sendVerificationCode);

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: تایید کد
 *     description: تایید کد ارسال شده برای فعال سازی حساب یا بازیابی رمز عبور
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
 *                 example: "user@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "09123456789"
 *               code:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 5
 *                 example: "12345"
 *     responses:
 *       200:
 *         description: حساب کاربری با موفقیت تایید شد
 */
router.post('/verify-code', validate(verifyCodeSchema), verifyCode);

/**
 * @swagger
 * /api/auth/register-phone:
 *   post:
 *     summary: ثبت‌نام با شماره تلفن
 *     description: ایجاد حساب کاربری جدید با شماره تلفن
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
 *                 example: "علی"
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 example: "محمدی"
 *               phoneNumber:
 *                 type: string
 *                 example: "09123456789"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       201:
 *         description: کاربر ثبت‌نام شد. کد تایید ارسال شد
 */
router.post('/register-phone', validate(registerWithPhoneSchema), registerWithPhone);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: بازیابی رمز عبور
 *     description: درخواست بازنشانی رمز عبور
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
 *                 example: "user@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "09123456789"
 *     responses:
 *       200:
 *         description: اگر حساب وجود داشته باشد، کد بازنشانی ارسال شد
 */
router.post('/forgot-password', validate(sendVerificationCodeSchema), forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: بازنشانی رمز عبور
 *     description: بازنشانی رمز عبور با کد تایید
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
 *                 example: "user@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "09123456789"
 *               code:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 5
 *                 example: "12345"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: رمز عبور با موفقیت بازنشانی شد
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;