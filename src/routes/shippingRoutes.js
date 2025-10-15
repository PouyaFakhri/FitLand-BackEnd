const express = require('express');
const { trackShipping, getShippingCarriers } = require('../controllers/shippingController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: مدیریت حمل و نقل - Shipping Management
 */

/**
 * @swagger
 * /api/shipping/track/{trackingNumber}:
 *   get:
 *     summary: Track Shipping
 *     description: رهگیری وضعیت حمل و نقل با کد پیگیری - Track shipping status by tracking number
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: کد پیگیری پستی - Tracking number
 *         example: "TR123456789"
 *     responses:
 *       200:
 *         description: وضعیت حمل و نقل دریافت شد - Shipping status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     trackingNumber:
 *                       type: string
 *                     orderCode:
 *                       type: string
 *                     recipient:
 *                       type: string
 *                     address:
 *                       type: string
 *                     status:
 *                       type: string
 *                     description:
 *                       type: string
 *                     progress:
 *                       type: integer
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           event:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           completed:
 *                             type: boolean
 *                           description:
 *                             type: string
 *                     estimatedDelivery:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: کد پیگیری یافت نشد - Tracking number not found
 */
router.get('/track/:trackingNumber', trackShipping);

/**
 * @swagger
 * /api/shipping/carriers:
 *   get:
 *     summary: Get Shipping Carriers
 *     description: دریافت لیست شرکت‌های حمل و نقل موجود - Get available shipping carriers
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: لیست شرکت‌های حمل و نقل دریافت شد - Shipping carriers retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       cost:
 *                         type: number
 *                       estimatedDays:
 *                         type: integer
 */
router.get('/carriers', getShippingCarriers);

module.exports = router;