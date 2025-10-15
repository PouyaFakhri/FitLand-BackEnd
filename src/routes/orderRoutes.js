// src/routes/orderRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { createOrder, getOrders, getOrderById, createCashOnDeliveryOrder } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { orderSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: مدیریت سفارشات - Orders Management
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get User Orders
 *     description: دریافت لیست سفارشات کاربر - Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, PENDING, PAID, SHIPPED, COMPLETED, CANCELLED, RETURNED]
 *           default: all
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, total-high, total-low]
 *           default: newest
 *     responses:
 *       200:
 *         description: لیست سفارشات دریافت شد - Orders retrieved successfully
 */
router.get('/', authMiddleware(), getOrders);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get Order by ID
 *     description: دریافت جزئیات سفارش - Get order details
 *     tags: [Orders]
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
 *         description: جزئیات سفارش دریافت شد - Order details retrieved
 *       404:
 *         description: سفارش یافت نشد - Order not found
 */
router.get('/:orderId', authMiddleware(), getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create New Order
 *     description: ایجاد سفارش جدید - Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - address
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 100
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *               address:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: سفارش با موفقیت ایجاد شد - Order created successfully
 *       400:
 *         description: موجودی ناکافی - Insufficient stock
 */
router.post('/', authMiddleware(), validate(orderSchema), createOrder);

/**
 * @swagger
 * /api/orders/cash-on-delivery:
 *   post:
 *     summary: Create Cash on Delivery Order
 *     description: ایجاد سفارش با پرداخت در محل - Create order with cash on delivery
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - address
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *               address:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       201:
 *         description: سفارش با پرداخت در محل ثبت شد - Cash on delivery order created
 */
router.post('/cash-on-delivery', authMiddleware(), validate(orderSchema), createCashOnDeliveryOrder);

module.exports = router;