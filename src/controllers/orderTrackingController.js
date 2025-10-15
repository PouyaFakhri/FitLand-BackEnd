// src/controllers/orderTrackingController.js - جدید
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/orders/tracking/{orderCode}:
 *   get:
 *     summary: Track order by order code
 *     tags: [Order Tracking]
 *     parameters:
 *       - in: path
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order tracking information
 *       404:
 *         description: Order not found
 */
const trackOrder = async (req, res) => {
  try {
    const { orderCode } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: {
        id: true,
        orderCode: true,
        status: true,
        total: true,
        createdAt: true,
        estimatedDelivery: true,
        trackingNumber: true,
        shippingMethod: true,
        items: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            },
            quantity: true,
            size: true,
            color: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // اطلاعات وضعیت سفارش
    const statusInfo = {
      PENDING: {
        status: 'Pending',
        description: 'سفارش در انتظار پرداخت',
        progress: 25
      },
      PAID: {
        status: 'Paid',
        description: 'سفارش پرداخت شده و در حال آماده‌سازی',
        progress: 50
      },
      SHIPPED: {
        status: 'Shipped',
        description: 'سفارش ارسال شده',
        progress: 75
      },
      COMPLETED: {
        status: 'Completed',
        description: 'سفارش تحویل داده شده',
        progress: 100
      },
      CANCELLED: {
        status: 'Cancelled',
        description: 'سفارش لغو شده',
        progress: 0
      },
      RETURNED: {
        status: 'Returned',
        description: 'سفارش مرجوع شده',
        progress: 0
      }
    };

    const trackingInfo = {
      ...order,
      statusDetails: statusInfo[order.status] || {
        status: order.status,
        description: 'وضعیت نامشخص',
        progress: 0
      },
      timeline: generateOrderTimeline(order)
    };

    res.json(trackingInfo);
  } catch (err) {
    logger.error('Track order failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/orders/{orderId}/tracking:
 *   put:
 *     summary: Update order tracking information (Admin only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *               shippingMethod:
 *                 type: string
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Tracking information updated
 *       404:
 *         description: Order not found
 */
const updateTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, shippingMethod, estimatedDelivery } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        shippingMethod,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null
      }
    });

    logger.info('Order tracking updated', { orderId, trackingNumber });

    res.json(updatedOrder);
  } catch (err) {
    logger.error('Update tracking failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

// تابع کمکی برای تولید تایم‌لاین سفارش
const generateOrderTimeline = (order) => {
  const timeline = [
    {
      event: 'سفارش ثبت شد',
      date: order.createdAt,
      completed: true,
      description: 'سفارش شما با موفقیت ثبت شد'
    }
  ];

  if (order.status !== 'PENDING') {
    timeline.push({
      event: 'پرداخت تایید شد',
      date: new Date(order.createdAt.getTime() + 10 * 60 * 1000), // 10 minutes later
      completed: true,
      description: 'پرداخت شما با موفقیت تأیید شد'
    });
  }

  if (['SHIPPED', 'COMPLETED'].includes(order.status)) {
    timeline.push({
      event: 'سفارش ارسال شد',
      date: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000), // 1 day later
      completed: true,
      description: order.trackingNumber 
        ? `سفارش با کد پیگیری ${order.trackingNumber} ارسال شد`
        : 'سفارش ارسال شد'
    });
  }

  if (order.status === 'COMPLETED') {
    timeline.push({
      event: 'سفارش تحویل داده شد',
      date: order.estimatedDelivery || new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      completed: true,
      description: 'سفارش با موفقیت تحویل داده شد'
    });
  }

  if (order.estimatedDelivery && order.status === 'SHIPPED') {
    timeline.push({
      event: 'تحویل پیش‌بینیشده',
      date: order.estimatedDelivery,
      completed: false,
      description: 'زمان تخمینی تحویل سفارش'
    });
  }

  return timeline;
};

module.exports = {
  trackOrder,
  updateTracking
};