// src/controllers/paymentController.js - نسخه ساده بدون Stripe
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create mock payment intent
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
 *         description: Mock payment intent created
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ 
      where: { id: orderId }, 
      include: { items: true } 
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // شبیه‌سازی ایجاد payment intent
    const mockClientSecret = `mock_pi_${orderId}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({ 
      clientSecret: mockClientSecret,
      amount: order.total,
      currency: 'IRT',
      status: 'requires_payment_method'
    });
  } catch (err) {
    logger.error('Create payment intent failed', { error: err.message });
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Mock webhook for payment events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
const stripeWebhook = async (req, res) => {
  try {
    // شبیه‌سازی webhook
    logger.info('Mock webhook received', { body: req.body });
    
    res.json({ 
      received: true,
      message: 'Mock webhook processed successfully'
    });
  } catch (err) {
    logger.error('Webhook processing failed', { error: err.message });
    res.status(400).json({ message: 'Webhook processing failed' });
  }
};

/**
 * @swagger
 * /api/payments/mock:
 *   post:
 *     summary: Mock payment for testing
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
 *         description: Mock payment successful
 */
const mockPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // آپدیت وضعیت سفارش به پرداخت شده
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    });

    logger.info('Mock payment processed successfully', { orderId });
    
    res.json({ 
      message: `Payment successful for order ${orderId}`, 
      status: 'paid',
      orderId,
      paidAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Mock payment failed', { error: err.message });
    res.status(500).json({ message: 'Mock payment failed' });
  }
};

/**
 * @swagger
 * /api/payments/cash-on-delivery:
 *   post:
 *     summary: Create cash on delivery order
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
 *         description: Cash on delivery order created
 */
const createCashOnDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // وضعیت سفارش را به pending تغییر می‌دهیم (پرداخت در محل)
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PENDING',
        paymentMethod: 'CASH_ON_DELIVERY'
      }
    });

    logger.info('Cash on delivery order created', { orderId });
    
    res.json({ 
      message: `Cash on delivery order ${orderId} created successfully`,
      status: 'pending',
      paymentMethod: 'CASH_ON_DELIVERY'
    });
  } catch (err) {
    logger.error('Cash on delivery failed', { error: err.message });
    res.status(500).json({ message: 'Failed to create cash on delivery order' });
  }
};

module.exports = {
  createPaymentIntent,
  stripeWebhook,
  mockPayment,
  createCashOnDelivery
};