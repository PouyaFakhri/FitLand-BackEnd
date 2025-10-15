// src/routes/wishlistRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { 
  getWishlist, 
  addToWishlist, 
  removeFromWishlist 
} = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateParams } = require('../utils/validation');
const { wishlistSchema, wishlistProductIdParamSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: مدیریت لیست علاقه‌مندی‌ها - Wishlist Management
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get User Wishlist
 *     description: دریافت لیست علاقه‌مندی‌های کاربر - Get user's wishlist
 *     tags: [Wishlist]
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
 *     responses:
 *       200:
 *         description: لیست علاقه‌مندی‌ها دریافت شد - Wishlist retrieved successfully
 */
router.get('/', authMiddleware(), getWishlist);

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add Product to Wishlist
 *     description: افزودن محصول به علاقه‌مندی‌ها - Add product to wishlist
 *     tags: [Wishlist]
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
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       201:
 *         description: محصول به علاقه‌مندی‌ها اضافه شد - Product added to wishlist
 *       400:
 *         description: محصول از قبل در لیست است - Product already in wishlist
 *       404:
 *         description: محصول یافت نشد - Product not found
 */
router.post('/', authMiddleware(), validate(wishlistSchema), addToWishlist);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove Product from Wishlist
 *     description: حذف محصول از علاقه‌مندی‌ها - Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *     responses:
 *       200:
 *         description: محصول از علاقه‌مندی‌ها حذف شد - Product removed from wishlist
 *       404:
 *         description: محصول در لیست یافت نشد - Product not found in wishlist
 */
router.delete('/:productId', authMiddleware(), validateParams(wishlistProductIdParamSchema), removeFromWishlist);

module.exports = router;