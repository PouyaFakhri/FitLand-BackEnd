// src/routes/authRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { 
  register,
  login,
  refresh,
  logout
} = require('../controllers/authController');
const { validate } = require('../utils/validation');
const { userRegistrationSchema, userLoginSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: احراز هویت پایه - Basic Authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register New User
 *     description: ثبت‌نام کاربر جدید - Register a new user
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
 *         description: کاربر با موفقیت ثبت‌نام شد - User registered successfully
 *       409:
 *         description: ایمیل از قبل وجود دارد - Email already exists
 */
router.post('/register', validate(userRegistrationSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User Login
 *     description: ورود کاربر - User login
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
 *         description: ورود موفقیت‌آمیز - Login successful
 *       401:
 *         description: اطلاعات نامعتبر - Invalid credentials
 */
router.post('/login', validate(userLoginSchema), login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     description: تازه‌سازی توکن دسترسی - Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: توکن تازه‌سازی شد - Token refreshed successfully
 *       403:
 *         description: توکن نامعتبر - Invalid refresh token
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User Logout
 *     description: خروج کاربر - User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: خروج موفقیت‌آمیز - Logout successful
 */
router.post('/logout', logout);

module.exports = router;