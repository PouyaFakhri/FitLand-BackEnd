// src/routes/authEnhancedRoutes.js - نسخه اصلاح شده
const express = require('express');
const { z } = require('zod');
const { 
  sendVerificationCode, 
  verifyCode, 
  registerWithPhone, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authEnhancedController');
const { validate } = require('../utils/validation');

const router = express.Router();

// تعریف schemaها به صورت مستقل (بدون استفاده از extend)
const baseSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional()
}).refine((data) => data.email || data.phoneNumber, {
  message: 'Email or phone number is required',
  path: []
});

const sendCodeSchema = baseSchema;

const verifyCodeSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  code: z.string().length(5, 'Code must be exactly 5 characters')
}).refine((data) => data.email || data.phoneNumber, {
  message: 'Email or phone number is required',
  path: []
});

const registerWithPhoneSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(1).max(50),
  phoneNumber: z.string().regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid phone format'),
  email: z.string().email().optional()
});

const resetPasswordSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  code: z.string().length(5, 'Code must be exactly 5 characters'),
  newPassword: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
}).refine((data) => data.email || data.phoneNumber, {
  message: 'Email or phone number is required',
  path: []
});

/**
 * @swagger
 * tags:
 *   name: Auth Enhanced
 *   description: احراز هویت پیشرفته - Enhanced Authentication
 */

/**
 * @swagger
 * /api/auth-enhanced/send-verification:
 *   post:
 *     summary: ارسال کد تایید
 *     description: ارسال کد تایید به ایمیل یا شماره تلفن کاربر
 *     tags: [Auth Enhanced]
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
 *     responses:
 *       200:
 *         description: کد تایید با موفقیت ارسال شد
 */
router.post('/send-verification', validate(sendCodeSchema), sendVerificationCode);

/**
 * @swagger
 * /api/auth-enhanced/verify-code:
 *   post:
 *     summary: تایید کد
 *     description: تایید کد ارسال شده برای فعال سازی حساب یا بازیابی رمز عبور
 *     tags: [Auth Enhanced]
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
 * /api/auth-enhanced/register-phone:
 *   post:
 *     summary: ثبت‌نام با شماره تلفن
 *     description: ایجاد حساب کاربری جدید با شماره تلفن
 *     tags: [Auth Enhanced]
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
 * /api/auth-enhanced/forgot-password:
 *   post:
 *     summary: بازیابی رمز عبور
 *     description: درخواست بازنشانی رمز عبور
 *     tags: [Auth Enhanced]
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
router.post('/forgot-password', validate(sendCodeSchema), forgotPassword);

/**
 * @swagger
 * /api/auth-enhanced/reset-password:
 *   post:
 *     summary: بازنشانی رمز عبور
 *     description: بازنشانی رمز عبور با کد تایید
 *     tags: [Auth Enhanced]
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