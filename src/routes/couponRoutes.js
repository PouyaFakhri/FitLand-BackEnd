// src/routes/couponRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getUserCoupons
} = require('../controllers/couponController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateParams } = require('../utils/validation');
const { 
  validateCouponSchema, 
  couponSchema,
  uuidParamSchema
} = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: مدیریت کدهای تخفیف - Coupons Management
 */

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate Coupon
 *     description: اعتبارسنجی کد تخفیف - Validate coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *             properties:
 *               code:
 *                 type: string
 *                 example: "WELCOME10"
 *               cartTotal:
 *                 type: number
 *                 example: 150000
 *     responses:
 *       200:
 *         description: کد تخفیف معتبر است - Coupon is valid
 *       400:
 *         description: کد تخفیف نامعتبر - Invalid coupon
 */
router.post('/validate', authMiddleware(), validate(validateCouponSchema), validateCoupon);

/**
 * @swagger
 * /api/coupons/user:
 *   get:
 *     summary: Get User Coupons
 *     description: دریافت کدهای تخفیف کاربر - Get user's coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست کدهای تخفیف دریافت شد - Coupons retrieved
 */
router.get('/user', authMiddleware(), getUserCoupons);

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get All Coupons (Admin)
 *     description: دریافت تمام کدهای تخفیف (ادمین) - Get all coupons (Admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: لیست کدهای تخفیف دریافت شد - Coupons retrieved
 */
router.get('/', authMiddleware(['ADMIN']), getCoupons);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create Coupon (Admin)
 *     description: ایجاد کد تخفیف جدید (ادمین) - Create new coupon (Admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - value
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               value:
 *                 type: number
 *               minOrder:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               usageLimit:
 *                 type: integer
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: کد تخفیف ایجاد شد - Coupon created
 */
router.post('/', authMiddleware(['ADMIN']), validate(couponSchema), createCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   put:
 *     summary: Update Coupon (Admin)
 *     description: به‌روزرسانی کد تخفیف (ادمین) - Update coupon (Admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               value:
 *                 type: number
 *               minOrder:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               usageLimit:
 *                 type: integer
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: کد تخفیف به‌روزرسانی شد - Coupon updated
 */
router.put('/:id', authMiddleware(['ADMIN']), validateParams(uuidParamSchema), validate(couponSchema.partial()), updateCoupon);

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete Coupon (Admin)
 *     description: حذف کد تخفیف (ادمین) - Delete coupon (Admin)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: کد تخفیف حذف شد - Coupon deleted
 */
router.delete('/:id', authMiddleware(['ADMIN']), validateParams(uuidParamSchema), deleteCoupon);

module.exports = router;