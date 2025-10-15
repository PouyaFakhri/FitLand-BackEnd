// src/routes/reviewRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { addReview, getReviews, updateReview, deleteReview, markHelpful } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateParams } = require('../utils/validation');
const { reviewSchema, updateReviewSchema, reviewIdParamSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: مدیریت نظرات - Reviews Management
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get Product Reviews
 *     description: دریافت نظرات محصول - Get product reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: approvedOnly
 *         schema:
 *           type: boolean
 *           default: true
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
 *     responses:
 *       200:
 *         description: نظرات دریافت شدند - Reviews retrieved
 */
router.get('/', getReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Add Review
 *     description: افزودن نظر جدید - Add new review
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               text:
 *                 type: string
 *                 maxLength: 500
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: نظر ثبت شد - Review added
 *       400:
 *         description: کاربر محصول را خریداری نکرده - User hasn't purchased product
 */
router.post('/', authMiddleware(), validate(reviewSchema), addReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update Review
 *     description: به‌روزرسانی نظر - Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               text:
 *                 type: string
 *                 maxLength: 500
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       200:
 *         description: نظر به‌روزرسانی شد - Review updated
 *       404:
 *         description: نظر یافت نشد - Review not found
 */
router.put('/:reviewId', authMiddleware(), validateParams(reviewIdParamSchema), validate(updateReviewSchema), updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete Review
 *     description: حذف نظر - Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: نظر حذف شد - Review deleted
 *       404:
 *         description: نظر یافت نشد - Review not found
 */
router.delete('/:reviewId', authMiddleware(), validateParams(reviewIdParamSchema), deleteReview);

/**
 * @swagger
 * /api/reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark Review as Helpful
 *     description: علامت‌گذاری نظر به عنوان مفید - Mark review as helpful
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: نظر به عنوان مفید علامت‌گذاری شد - Review marked as helpful
 */
router.post('/:reviewId/helpful', authMiddleware(), validateParams(reviewIdParamSchema), markHelpful);

module.exports = router;