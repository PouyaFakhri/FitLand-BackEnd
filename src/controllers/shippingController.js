// src/controllers/shippingController.js - جدید
const prisma = require('../config/db');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/shipping/track/{trackingNumber}:
 *   get:
 *     summary: Track shipping status by tracking number
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping status retrieved successfully
 *       404:
 *         description: Tracking number not found
 */
const trackShipping = catchAsync(async (req, res) => {
  const { trackingNumber } = req.params;

  // پیدا کردن سفارش با کد پیگیری
  const order = await prisma.order.findFirst({
    where: { 
      trackingNumber,
      status: { in: ['SHIPPED', 'COMPLETED'] }
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new AppError('کد پیگیری یافت نشد', 404, 'TRACKING_NOT_FOUND');
  }

  // شبیه‌سازی وضعیت حمل‌ونقل (در واقعیت از API شرکت پستی استفاده کنید)
  const shippingStatus = simulateShippingStatus(order.createdAt, order.status);

  const trackingInfo = {
    trackingNumber,
    orderCode: order.orderCode,
    recipient: `${order.user.firstName} ${order.user.lastName}`,
    address: order.address,
    status: shippingStatus.status,
    description: shippingStatus.description,
    progress: shippingStatus.progress,
    timeline: shippingStatus.timeline,
    items: order.items.map(item => ({
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity
    })),
    estimatedDelivery: order.estimatedDelivery,
    shippedAt: order.status === 'SHIPPED' ? order.updatedAt : null,
    deliveredAt: order.status === 'COMPLETED' ? order.updatedAt : null
  };

  logger.info('Shipping status tracked', { trackingNumber, status: shippingStatus.status });

  res.json({
    success: true,
    data: trackingInfo
  });
});

// تابع کمکی برای شبیه‌سازی وضعیت حمل‌ونقل
const simulateShippingStatus = (orderDate, orderStatus) => {
  const now = new Date();
  const orderTime = new Date(orderDate);
  const daysPassed = Math.floor((now - orderTime) / (1000 * 60 * 60 * 24));

  if (orderStatus === 'COMPLETED') {
    return {
      status: 'DELIVERED',
      description: 'مرسوله تحویل مشتری شده است',
      progress: 100,
      timeline: [
        { event: 'ثبت سفارش', date: orderTime, completed: true },
        { event: 'آماده‌سازی', date: new Date(orderTime.getTime() + 1 * 24 * 60 * 60 * 1000), completed: true },
        { event: 'تحویل به پست', date: new Date(orderTime.getTime() + 2 * 24 * 60 * 60 * 1000), completed: true },
        { event: 'تحویل به مشتری', date: new Date(orderTime.getTime() + 4 * 24 * 60 * 60 * 1000), completed: true }
      ]
    };
  }

  if (daysPassed >= 4) {
    return {
      status: 'OUT_FOR_DELIVERY',
      description: 'مرسوله در حال تحویل به آدرس شما است',
      progress: 75,
      timeline: [
        { event: 'ثبت سفارش', date: orderTime, completed: true },
        { event: 'آماده‌سازی', date: new Date(orderTime.getTime() + 1 * 24 * 60 * 60 * 1000), completed: true },
        { event: 'تحویل به پست', date: new Date(orderTime.getTime() + 2 * 24 * 60 * 60 * 1000), completed: true },
        { event: 'تحویل به مشتری', date: new Date(orderTime.getTime() + 4 * 24 * 60 * 60 * 1000), completed: false }
      ]
    };
  }

  if (daysPassed >= 2) {
    return {
      status: 'IN_TRANSIT',
      description: 'مرسوله در مرکز توزیع است',
      progress: 50,
      timeline: [
        { event: 'ثبت سفارش', date: orderTime, completed: true },
        { event: 'آماده‌سازی', date: new Date(orderTime.getTime() + 1 * 24 * 60 * 60 * 1000), completed: true },
        { event: 'تحویل به پست', date: new Date(orderTime.getTime() + 2 * 24 * 60 * 60 * 1000), completed: true },
        { event: 'تحویل به مشتری', date: new Date(orderTime.getTime() + 4 * 24 * 60 * 60 * 1000), completed: false }
      ]
    };
  }

  return {
    status: 'PROCESSING',
    description: 'سفارش در حال آماده‌سازی است',
    progress: 25,
    timeline: [
      { event: 'ثبت سفارش', date: orderTime, completed: true },
      { event: 'آماده‌سازی', date: new Date(orderTime.getTime() + 1 * 24 * 60 * 60 * 1000), completed: false },
      { event: 'تحویل به پست', date: new Date(orderTime.getTime() + 2 * 24 * 60 * 60 * 1000), completed: false },
      { event: 'تحویل به مشتری', date: new Date(orderTime.getTime() + 4 * 24 * 60 * 60 * 1000), completed: false }
    ]
  };
};

/**
 * @swagger
 * /api/shipping/carriers:
 *   get:
 *     summary: Get available shipping carriers
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: List of available carriers
 */
const getShippingCarriers = catchAsync(async (req, res) => {
  const carriers = [
    {
      id: 'post',
      name: 'پست پیشتاز',
      description: 'تحویل ۲-۴ روز کاری',
      cost: 40000,
      estimatedDays: 3
    },
    {
      id: 'tipax',
      name: 'تیپاکس',
      description: 'تحویل ۱-۳ روز کاری', 
      cost: 35000,
      estimatedDays: 2
    },
    {
      id: 'alopeyk',
      name: 'الوپیک',
      description: 'تحویل همان روز',
      cost: 25000,
      estimatedDays: 1
    }
  ];

  res.json({
    success: true,
    data: carriers
  });
});

module.exports = {
  trackShipping,
  getShippingCarriers
};