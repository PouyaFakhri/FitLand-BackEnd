const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../config/db');

/**
 * @swagger
 * tags:
 *   name: User Dashboard
 *   description: داشبورد کاربر - User Dashboard
 */

/**
 * @swagger
 * /api/user/dashboard:
 *   get:
 *     summary: Get User Dashboard Data
 *     description: دریافت اطلاعات کامل داشبورد کاربر - Get complete user dashboard data
 *     tags: [User Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: اطلاعات داشبورد دریافت شد - User dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 addresses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *                 wishlist:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishlistItem'
 *                 recentReviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                     totalReviews:
 *                       type: integer
 *                     wishlistCount:
 *                       type: integer
 *                     totalSpent:
 *                       type: object
 *                       properties:
 *                         _sum:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 */
router.get('/dashboard', authMiddleware(), async (req, res) => {
  try {
    const [user, orders, addresses, wishlist, reviews] = await Promise.all([
      prisma.user.findUnique({ 
        where: { id: req.user.id },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true, 
          phoneNumber: true,
          isVerified: true,
          createdAt: true
        }
      }),
      prisma.order.findMany({
        where: { userId: req.user.id },
        include: { 
          items: { 
            include: { 
              product: { 
                select: { 
                  id: true,
                  name: true, 
                  imageUrl: true, 
                  price: true,
                  discountPercent: true
                } 
              } 
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.address.findMany({
        where: { userId: req.user.id },
        orderBy: { isDefault: 'desc' }
      }),
      prisma.wishlist.findMany({
        where: { userId: req.user.id },
        include: { 
          product: { 
            select: { 
              id: true, 
              name: true, 
              imageUrl: true, 
              price: true, 
              discountPercent: true,
              stock: true,
              category: {
                select: { name: true }
              }
            } 
          } 
        },
        take: 8
      }),
      prisma.review.findMany({
        where: { userId: req.user.id },
        include: { 
          product: { 
            select: { 
              id: true,
              name: true, 
              imageUrl: true 
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
    ]);

    // محاسبه قیمت نهایی برای محصولات
    const wishlistWithFinalPrice = wishlist.map(item => ({
      ...item,
      product: {
        ...item.product,
        finalPrice: item.product.price * (1 - (item.product.discountPercent || 0) / 100),
        hasDiscount: (item.product.discountPercent || 0) > 0
      }
    }));

    // محاسبه آمار
    const stats = {
      totalOrders: await prisma.order.count({ where: { userId: req.user.id } }),
      totalReviews: await prisma.review.count({ where: { userId: req.user.id } }),
      wishlistCount: await prisma.wishlist.count({ where: { userId: req.user.id } }),
      totalSpent: await prisma.order.aggregate({
        where: { 
          userId: req.user.id,
          status: { in: ['COMPLETED', 'PAID', 'SHIPPED'] }
        },
        _sum: { total: true }
      })
    };

    res.json({
      user,
      recentOrders: orders,
      addresses,
      wishlist: wishlistWithFinalPrice,
      recentReviews: reviews,
      stats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/user/order-stats:
 *   get:
 *     summary: Get User Order Statistics
 *     description: دریافت آمار سفارشات کاربر بر اساس وضعیت - Get user order statistics by status
 *     tags: [User Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: آمار سفارشات دریافت شد - Order statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 PENDING:
 *                   type: integer
 *                   description: تعداد سفارشات در انتظار پرداخت - Pending orders count
 *                 PAID:
 *                   type: integer
 *                   description: تعداد سفارشات پرداخت شده - Paid orders count
 *                 SHIPPED:
 *                   type: integer
 *                   description: تعداد سفارشات ارسال شده - Shipped orders count
 *                 COMPLETED:
 *                   type: integer
 *                   description: تعداد سفارشات تکمیل شده - Completed orders count
 *                 CANCELLED:
 *                   type: integer
 *                   description: تعداد سفارشات لغو شده - Cancelled orders count
 *                 RETURNED:
 *                   type: integer
 *                   description: تعداد سفارشات مرجوع شده - Returned orders count
 */
router.get('/order-stats', authMiddleware(), async (req, res) => {
  try {
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { userId: req.user.id },
      _count: { id: true }
    });

    // تبدیل به فرمت مناسب برای نمودارها
    const stats = {
      PENDING: orderStats.find(s => s.status === 'PENDING')?._count.id || 0,
      PAID: orderStats.find(s => s.status === 'PAID')?._count.id || 0,
      SHIPPED: orderStats.find(s => s.status === 'SHIPPED')?._count.id || 0,
      COMPLETED: orderStats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      CANCELLED: orderStats.find(s => s.status === 'CANCELLED')?._count.id || 0,
      RETURNED: orderStats.find(s => s.status === 'RETURNED')?._count.id || 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;