// src/controllers/couponController.js - نسخه کامل
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate coupon code
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
 *         description: Coupon validated successfully
 *       400:
 *         description: Invalid coupon or conditions not met
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user.id;

    // پیدا کردن کوپن
    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon) {
      return res.status(400).json({ 
        success: false,
        message: 'کد تخفیف معتبر نیست' 
      });
    }

    // بررسی فعال بودن
    if (!coupon.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'این کد تخفیف غیرفعال است' 
      });
    }

    // بررسی تاریخ انقضا
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ 
        success: false,
        message: 'کد تخفیف منقضی شده است' 
      });
    }

    // بررسی حداقل سفارش
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return res.status(400).json({ 
        success: false,
        message: `حداقل مبلغ سفارش برای استفاده از این کد ${coupon.minOrder} تومان است` 
      });
    }

    // بررسی محدودیت استفاده
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ 
        success: false,
        message: 'تعداد استفاده از این کد تخفیف به پایان رسیده است' 
      });
    }

    // بررسی اینکه کاربر قبلاً از این کوپن استفاده کرده
    const userCoupon = await prisma.userCoupon.findFirst({
      where: { 
        userId, 
        couponId: coupon.id,
        used: true 
      }
    });

    if (userCoupon) {
      return res.status(400).json({ 
        success: false,
        message: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' 
      });
    }

    // محاسبه مقدار تخفیف
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (cartTotal * coupon.value) / 100;
      // اعمال محدودیت حداکثر تخفیف
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // اطمینان از اینکه تخفیف بیشتر از مبلغ سبد خرید نباشد
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    const finalAmount = cartTotal - discountAmount;

    logger.info('Coupon validated successfully', { 
      couponCode: code, 
      userId,
      discountAmount 
    });

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          value: coupon.value,
          minOrder: coupon.minOrder,
          maxDiscount: coupon.maxDiscount
        },
        discountAmount,
        finalAmount,
        originalAmount: cartTotal
      }
    });

  } catch (err) {
    logger.error('Validate coupon failed', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: 'خطا در اعتبارسنجی کد تخفیف' 
    });
  }
};

/**
 * @swagger
 * /api/coupons/user:
 *   get:
 *     summary: Get User Coupons
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User coupons retrieved
 */
const getUserCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const coupons = await prisma.userCoupon.findMany({
      where: { userId, used: false },
      include: { coupon: true }
    });
    res.json({ success: true, data: coupons });
  } catch (err) {
    logger.error('Get user coupons failed', { error: err.message });
    res.status(500).json({ message: 'Failed to retrieve user coupons' });
  }
};

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get All Coupons (Admin)
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
 *         description: Coupons retrieved
 */
const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, activeOnly = false } = req.query;
    const where = activeOnly ? { isActive: true } : {};
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.coupon.count({ where })
    ]);
    res.json({
      success: true,
      data: { 
        coupons, 
        pagination: { 
          page: parseInt(page), 
          limit: parseInt(limit), 
          total, 
          totalPages: Math.ceil(total / parseInt(limit)) 
        } 
      }
    });
  } catch (err) {
    logger.error('Get coupons failed', { error: err.message });
    res.status(500).json({ message: 'Failed to retrieve coupons' });
  }
};

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create Coupon (Admin)
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
 *         description: Coupon created
 */
const createCoupon = async (req, res) => {
  try {
    const coupon = await prisma.coupon.create({
      data: req.body
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    logger.error('Create coupon failed', { error: err.message });
    res.status(500).json({ message: 'Failed to create coupon' });
  }
};

/**
 * @swagger
 * /api/coupons/{id}:
 *   put:
 *     summary: Update Coupon (Admin)
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
 *         description: Coupon updated
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: req.body
    });
    res.json({ success: true, data: coupon });
  } catch (err) {
    logger.error('Update coupon failed', { error: err.message });
    res.status(500).json({ message: 'Failed to update coupon' });
  }
};

/**
 * @swagger
 * /api/coupons/{id}:
 *   delete:
 *     summary: Delete Coupon (Admin)
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
 *         description: Coupon deleted
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    logger.error('Delete coupon failed', { error: err.message });
    res.status(500).json({ message: 'Failed to delete coupon' });
  }
};

module.exports = {
  validateCoupon,
  getUserCoupons,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};