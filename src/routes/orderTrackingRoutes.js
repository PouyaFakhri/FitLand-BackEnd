const express = require('express');
const { 
  trackOrder, 
  updateTracking 
} = require('../controllers/orderTrackingController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order Tracking
 *   description: رهگیری سفارشات - Order Tracking
 */

/**
 * @swagger
 * /api/orders/tracking/{orderCode}:
 *   get:
 *     summary: Track Order
 *     description: رهگیری سفارش بر اساس کد سفارش - Track order by order code
 *     tags: [Order Tracking]
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: string
 *         description: کد سفارش - Order code
 *         example: "12345678"
 *     responses:
 *       200:
 *         description: اطلاعات رهگیری دریافت شد - Tracking information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trackingNumber:
 *                   type: string
 *                   description: کد پیگیری - Tracking number
 *                 orderCode:
 *                   type: string
 *                   description: کد سفارش - Order code
 *                 status:
 *                   type: string
 *                   description: وضعیت سفارش - Order status
 *                 statusDetails:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     description:
 *                       type: string
 *                     progress:
 *                       type: integer
 *                 timeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       completed:
 *                         type: boolean
 *                       description:
 *                         type: string
 *                 estimatedDelivery:
 *                   type: string
 *                   format: date-time
 *                   description: زمان تخمینی تحویل - Estimated delivery time
 *       404:
 *         description: سفارش یافت نشد - Order not found
 */
router.get('/:orderCode', trackOrder);

/**
 * @swagger
 * /api/orders/{orderId}/tracking:
 *   put:
 *     summary: Update Tracking Information (Admin)
 *     description: به‌روزرسانی اطلاعات رهگیری (فقط ادمین) - Update tracking information (Admin only)
 *     tags: [Order Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه سفارش - Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: کد پیگیری پستی - Tracking number
 *                 example: "TR123456789"
 *               shippingMethod:
 *                 type: string
 *                 description: روش ارسال - Shipping method
 *                 example: "پست پیشتاز"
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *                 description: زمان تخمینی تحویل - Estimated delivery time
 *                 example: "2024-01-15T12:00:00.000Z"
 *     responses:
 *       200:
 *         description: اطلاعات رهگیری به‌روزرسانی شد - Tracking information updated
 *       404:
 *         description: سفارش یافت نشد - Order not found
 */
router.put('/:orderId/tracking', authMiddleware(['ADMIN']), updateTracking);

module.exports = router;