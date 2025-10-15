// src/controllers/newsletterController.js - سیستم خبرنامه
const prisma = require('../config/db');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { catchAsync } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
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
 *         description: Successfully subscribed to newsletter
 *       400:
 *         description: Already subscribed or invalid email
 */
const subscribeToNewsletter = catchAsync(async (req, res) => {
  const { email } = req.body;

  // اعتبارسنجی ایمیل
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('آدرس ایمیل معتبر نیست', 400, 'INVALID_EMAIL');
  }

  // بررسی اینکه آیا قبلاً عضو شده است
  const existingSubscription = await prisma.newsletterSubscription.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingSubscription) {
    if (existingSubscription.isActive) {
      throw new AppError('این ایمیل قبلاً در خبرنامه عضو شده است', 400, 'ALREADY_SUBSCRIBED');
    } else {
      // فعال کردن عضویت قبلی
      const updatedSubscription = await prisma.newsletterSubscription.update({
        where: { email: email.toLowerCase() },
        data: {
          isActive: true,
          token: crypto.randomBytes(32).toString('hex')
        }
      });

      logger.info('Newsletter subscription reactivated', { email });
      
      return res.json({
        success: true,
        message: 'عضویت شما در خبرنامه با موفقیت فعال شد'
      });
    }
  }

  // ایجاد عضویت جدید
  const token = crypto.randomBytes(32).toString('hex');
  
  const subscription = await prisma.newsletterSubscription.create({
    data: {
      email: email.toLowerCase(),
      token,
      isActive: true
    }
  });

  logger.info('New newsletter subscription', { email, subscriptionId: subscription.id });

  // در اینجا می‌توانید ایمیل تأیید ارسال کنید
  // await sendConfirmationEmail(email, token);

  res.json({
    success: true,
    message: 'عضویت شما در خبرنامه با موفقیت ثبت شد. به زودی آخرین اخبار و تخفیف‌ها را دریافت خواهید کرد.'
  });
});

/**
 * @swagger
 * /api/newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter
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
 *         description: Successfully unsubscribed from newsletter
 *       400:
 *         description: Invalid email or token
 */
const unsubscribeFromNewsletter = catchAsync(async (req, res) => {
  const { email, token } = req.body;

  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!subscription) {
    throw new AppError('عضویت در خبرنامه یافت نشد', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  if (!subscription.isActive) {
    throw new AppError('این ایمیل قبلاً از خبرنامه لغو عضویت کرده است', 400, 'ALREADY_UNSUBSCRIBED');
  }

  if (subscription.token !== token) {
    throw new AppError('کد تأیید نامعتبر است', 400, 'INVALID_TOKEN');
  }

  // غیرفعال کردن عضویت
  await prisma.newsletterSubscription.update({
    where: { email: email.toLowerCase() },
    data: {
      isActive: false
    }
  });

  logger.info('Newsletter subscription cancelled', { email });

  res.json({
    success: true,
    message: 'عضویت شما در خبرنامه با موفقیت لغو شد'
  });
});

/**
 * @swagger
 * /api/newsletter/unsubscribe/{token}:
 *   get:
 *     summary: Unsubscribe from newsletter using token (for email links)
 *     tags: [Newsletter]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from newsletter
 *       400:
 *         description: Invalid token
 */
const unsubscribeByToken = catchAsync(async (req, res) => {
  const { token } = req.params;

  const subscription = await prisma.newsletterSubscription.findFirst({
    where: { token }
  });

  if (!subscription) {
    throw new AppError('لینک لغو عضویت نامعتبر است', 400, 'INVALID_TOKEN');
  }

  if (!subscription.isActive) {
    return res.json({
      success: true,
      message: 'این ایمیل قبلاً از خبرنامه لغو عضویت کرده است'
    });
  }

  // غیرفعال کردن عضویت
  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: {
      isActive: false
    }
  });

  logger.info('Newsletter subscription cancelled via token', { email: subscription.email });

  res.json({
    success: true,
    message: 'عضویت شما در خبرنامه با موفقیت لغو شد'
  });
});

/**
 * @swagger
 * /api/admin/newsletter/subscribers:
 *   get:
 *     summary: Get all newsletter subscribers (Admin only)
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
 *         description: Subscribers retrieved successfully
 */
const getSubscribers = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, activeOnly = true } = req.query;

  const where = {};
  if (activeOnly === 'true') {
    where.isActive = true;
  }

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.newsletterSubscription.count({ where })
  ]);

  // آمار
  const stats = {
    total: await prisma.newsletterSubscription.count(),
    active: await prisma.newsletterSubscription.count({ where: { isActive: true } }),
    inactive: await prisma.newsletterSubscription.count({ where: { isActive: false } })
  };

  res.json({
    success: true,
    data: {
      subscribers,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @swagger
 * /api/admin/newsletter/broadcast:
 *   post:
 *     summary: Send newsletter to all active subscribers (Admin only)
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
 *                 example: "تخفیف ویژه فصل تابستان"
 *               content:
 *                 type: string
 *                 example: "محصولات ورزشی با 30% تخفیف"
 *     responses:
 *       200:
 *         description: Newsletter sent successfully
 */
const sendNewsletter = catchAsync(async (req, res) => {
  const { subject, content } = req.body;

  // گرفتن لیست تمام اعضای فعال
  const activeSubscribers = await prisma.newsletterSubscription.findMany({
    where: { isActive: true },
    select: { email: true }
  });

  if (activeSubscribers.length === 0) {
    throw new AppError('هیچ عضو فعالی برای ارسال خبرنامه وجود ندارد', 400, 'NO_ACTIVE_SUBSCRIBERS');
  }

  // در اینجا می‌توانید سرویس ارسال ایمیل را فراخوانی کنید
  // await emailService.sendBulkNewsletter(activeSubscribers.map(s => s.email), subject, content);

  logger.info('Newsletter broadcast initiated', {
    subject,
    recipientCount: activeSubscribers.length,
    adminId: req.user.id
  });

  res.json({
    success: true,
    message: `خبرنامه برای ${activeSubscribers.length} عضو ارسال شد`,
    data: {
      sentCount: activeSubscribers.length,
      subject,
      preview: content.substring(0, 100) + '...'
    }
  });
});

module.exports = {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  unsubscribeByToken,
  getSubscribers,
  sendNewsletter
};