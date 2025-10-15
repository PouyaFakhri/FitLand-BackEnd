// src/routes/newsletterRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  unsubscribeByToken,
  getSubscribers,
  sendNewsletter
} = require('../controllers/newsletterController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { 
  newsletterSubscribeSchema, 
  newsletterUnsubscribeSchema, 
  newsletterBroadcastSchema 
} = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Newsletter
 *   description: مدیریت سیستم خبرنامه - Newsletter Management
 */

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to Newsletter
 *     description: عضویت در خبرنامه - Subscribe to newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: عضویت موفق - Successfully subscribed
 *       400:
 *         description: ایمیل از قبل عضو است - Already subscribed
 */
router.post('/subscribe', validate(newsletterSubscribeSchema), subscribeToNewsletter);

/**
 * @swagger
 * /api/newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from Newsletter
 *     description: لغو عضویت از خبرنامه - Unsubscribe from newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: لغو عضویت موفق - Successfully unsubscribed
 *       400:
 *         description: توکن نامعتبر - Invalid token
 */
router.post('/unsubscribe', validate(newsletterUnsubscribeSchema), unsubscribeFromNewsletter);

/**
 * @swagger
 * /api/newsletter/unsubscribe/{token}:
 *   get:
 *     summary: Unsubscribe by Token
 *     description: لغو عضویت با توکن - Unsubscribe using token
 *     tags: [Newsletter]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: لغو عضویت موفق - Successfully unsubscribed
 */
router.get('/unsubscribe/:token', unsubscribeByToken);

/**
 * @swagger
 * /api/admin/newsletter/subscribers:
 *   get:
 *     summary: Get Subscribers (Admin)
 *     description: دریافت لیست اعضا (ادمین) - Get subscribers list (Admin)
 *     tags: [Newsletter]
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
 *           default: 50
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: لیست اعضا دریافت شد - Subscribers retrieved
 */
router.get('/admin/subscribers', authMiddleware(['ADMIN']), getSubscribers);

/**
 * @swagger
 * /api/admin/newsletter/broadcast:
 *   post:
 *     summary: Send Newsletter (Admin)
 *     description: ارسال خبرنامه (ادمین) - Send newsletter (Admin)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - content
 *             properties:
 *               subject:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *     responses:
 *       200:
 *         description: خبرنامه ارسال شد - Newsletter sent
 */
router.post('/admin/broadcast', authMiddleware(['ADMIN']), validate(newsletterBroadcastSchema), sendNewsletter);

module.exports = router;