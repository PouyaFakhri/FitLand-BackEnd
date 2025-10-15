// src/routes/cartRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateParams } = require('../utils/validation');
const { addToCartSchema, updateCartItemSchema, cartItemIdParamSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: مدیریت سبد خرید - Shopping Cart Management
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get User Cart
 *     description: دریافت سبد خرید کاربر - Get user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: سبد خرید دریافت شد - Cart retrieved successfully
 */
router.get('/', authMiddleware(), getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add Item to Cart
 *     description: افزودن محصول به سبد خرید - Add product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: محصول به سبد خرید اضافه شد - Item added to cart
 *       400:
 *         description: موجودی ناکافی - Insufficient stock
 */
router.post('/', authMiddleware(), validate(addToCartSchema), addToCart);

/**
 * @swagger
 * /api/cart/{itemId}:
 *   put:
 *     summary: Update Cart Item
 *     description: به‌روزرسانی تعداد محصول - Update item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: محصول به‌روزرسانی شد - Item updated
 *       404:
 *         description: محصول یافت نشد - Item not found
 */
router.put('/:itemId', authMiddleware(), validateParams(cartItemIdParamSchema), validate(updateCartItemSchema), updateCartItem);

/**
 * @swagger
 * /api/cart/{itemId}:
 *   delete:
 *     summary: Remove Item from Cart
 *     description: حذف محصول از سبد خرید - Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: محصول حذف شد - Item removed
 *       404:
 *         description: محصول یافت نشد - Item not found
 */
router.delete('/:itemId', authMiddleware(), validateParams(cartItemIdParamSchema), removeFromCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear Entire Cart
 *     description: پاک کردن کل سبد خرید - Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: سبد خرید پاک شد - Cart cleared
 */
router.delete('/', authMiddleware(), clearCart);

module.exports = router;