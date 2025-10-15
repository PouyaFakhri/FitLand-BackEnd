const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../utils/validation'); // Zod middleware
const { userUpdateSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: مدیریت پروفایل کاربر - User Profile Management
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get User Profile
 *     description: دریافت اطلاعات پروفایل کاربر - Get user profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: پروفایل کاربر دریافت شد - User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 phoneNumber:
 *                   type: string
 *                 nationalCode:
 *                   type: string
 *                 birthDate:
 *                   type: string
 *                   format: date-time
 *                 gender:
 *                   type: string
 *                   enum: [male, female]
 *                 isVerified:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
router.get('/profile', authMiddleware(), getUserProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update User Profile
 *     description: به‌روزرسانی اطلاعات پروفایل کاربر - Update user profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               phoneNumber:
 *                 type: string
 *               nationalCode:
 *                 type: string
 *                 length: 10
 *                 pattern: '^\d{10}$'
 *               birthDate:
 *                 type: string
 *                 format: date-time
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: پروفایل با موفقیت به‌روزرسانی شد - Profile updated successfully
 *       400:
 *         description: داده‌های ورودی نامعتبر - Invalid input data
 */
router.put('/profile', authMiddleware(), validate(userUpdateSchema), updateUserProfile);

module.exports = router;