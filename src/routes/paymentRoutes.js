// src/routes/paymentRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { 
  createPaymentIntent, 
  stripeWebhook, 
  mockPayment,
  createCashOnDelivery 
} = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { 
  paymentIntentSchema, 
  mockPaymentSchema, 
  cashOnDeliverySchema 
} = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: مدیریت پرداخت‌ها - Payments Management
 */

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create Payment Intent
 *     description: ایجاد قصد پرداخت - Create payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: قصد پرداخت ایجاد شد - Payment intent created
 *       404:
 *         description: سفارش یافت نشد - Order not found
 */
router.post('/create-intent', authMiddleware(), validate(paymentIntentSchema), createPaymentIntent);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Payment Webhook
 *     description: وب‌هوک پرداخت - Payment webhook
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: وب‌هوک پردازش شد - Webhook processed
 */
router.post('/webhook', stripeWebhook);

/**
 * @swagger
 * /api/payments/mock:
 *   post:
 *     summary: Mock Payment (Testing)
 *     description: پرداخت آزمایشی - Mock payment for testing
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: پرداخت آزمایشی موفق - Mock payment successful
 */
router.post('/mock', authMiddleware(), validate(mockPaymentSchema), mockPayment);

/**
 * @swagger
 * /api/payments/cash-on-delivery:
 *   post:
 *     summary: Cash on Delivery
 *     description: پرداخت در محل - Cash on delivery
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: سفارش با پرداخت در محل ثبت شد - Cash on delivery order created
 */
router.post('/cash-on-delivery', authMiddleware(), validate(cashOnDeliverySchema), createCashOnDelivery);

/**
 * @swagger
 * /api/payments/status/{orderId}:
 *   get:
 *     summary: Get Payment Status
 *     description: دریافت وضعیت پرداخت - Get payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: وضعیت پرداخت دریافت شد - Payment status retrieved
 *       404:
 *         description: سفارش یافت نشد - Order not found
 */
router.get('/status/:orderId', authMiddleware(), async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await require('../config/db').order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        total: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let paymentStatus = 'PENDING';
    if (order.status === 'PAID') {
      paymentStatus = 'PAID';
    } else if (order.status === 'CANCELLED') {
      paymentStatus = 'CANCELLED';
    }

    res.json({
      orderId: order.id,
      status: paymentStatus,
      paymentMethod: order.paymentMethod,
      amount: order.total,
      paidAt: order.status === 'PAID' ? order.updatedAt : null,
      orderStatus: order.status
    });
  } catch (err) {
    require('../utils/logger').error('Get payment status failed', { error: err.message });
    res.status(500).json({ message: 'Failed to retrieve payment status' });
  }
});

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get Payment Methods
 *     description: دریافت روش‌های پرداخت - Get available payment methods
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: روش‌های پرداخت دریافت شدند - Payment methods retrieved
 */
router.get('/methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'online',
        name: 'پرداخت آنلاین',
        description: 'پرداخت امن با درگاه بانکی',
        isActive: true
      },
      {
        id: 'cash_on_delivery',
        name: 'پرداخت در محل',
        description: 'پرداخت هنگام دریافت کالا',
        isActive: true
      }
    ]
  });
});

module.exports = router;