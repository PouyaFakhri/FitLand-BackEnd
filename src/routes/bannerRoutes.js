const express = require('express');
const { getBanners, createBanner } = require('../controllers/bannerController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: مدیریت بنرها - Banners Management
 */

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get Active Banners
 *     description: دریافت لیست بنرهای فعال - Get all active banners
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: لیست بنرها دریافت شد - Banners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: شناسه بنر - Banner ID
 *                   title:
 *                     type: string
 *                     description: عنوان بنر - Banner title
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                     description: آدرس تصویر - Image URL
 *                   link:
 *                     type: string
 *                     description: لینک بنر - Banner link
 *                   isActive:
 *                     type: boolean
 *                     description: آیا فعال است؟ - Is active?
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: تاریخ ایجاد - Creation date
 */
router.get('/', getBanners);

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create New Banner (Admin)
 *     description: ایجاد بنر جدید (فقط ادمین) - Create new banner (Admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان بنر - Banner title
 *                 example: "تخفیف ویژه تابستان"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: آدرس تصویر بنر - Banner image URL
 *                 example: "https://example.com/banner.jpg"
 *               link:
 *                 type: string
 *                 description: لینک بنر (اختیاری) - Banner link (optional)
 *                 example: "/products/summer-sale"
 *               isActive:
 *                 type: boolean
 *                 description: آیا فعال است؟ - Is active?
 *                 example: true
 *     responses:
 *       201:
 *         description: بنر با موفقیت ایجاد شد - Banner created successfully
 */
router.post('/', authMiddleware(['ADMIN']), createBanner);

module.exports = router;