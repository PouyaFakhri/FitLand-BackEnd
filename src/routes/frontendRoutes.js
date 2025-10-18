// routes/frontendRoutes.js
const express = require('express');
const prisma = require('../config/db');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Frontend
 *   description: داده‌های اولیه فرانت‌اند
 */

/**
 * @swagger
 * /api/frontend/init:
 *   get:
 *     summary: دریافت داده‌های اولیه برای صفحه اصلی
 *     description: دریافت دسته‌بندی‌ها، بنرها، محصولات ویژه و اخبار ورزشی برای نمایش در صفحه اصلی
 *     tags: [Frontend]
 *     responses:
 *       200:
 *         description: داده‌های اولیه با موفقیت دریافت شد
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       description: لیست دسته‌بندی‌های فعال
 *                     banners:
 *                       type: array
 *                       description: بنرهای فعال
 *                     featuredProducts:
 *                       type: array
 *                       description: محصولات ویژه
 *                     brands:
 *                       type: array
 *                       description: لیست برندها
 *                     sportsNews:
 *                       type: array
 *                       description: آخرین اخبار ورزشی
 *                     config:
 *                       type: object
 *                       description: تنظیمات سیستم
 *       500:
 *         description: خطای سرور
 */
router.get('/init', async (req, res) => {
  try {
    const [categories, banners, featuredProducts, brands, sportsNews] = await Promise.all([
      // دسته‌بندی‌های فعال
      prisma.category.findMany({
        where: { 
          products: { 
            some: { 
              isActive: true,
              stock: { gt: 0 }
            } 
          } 
        },
        include: { 
          _count: { 
            select: { 
              products: {
                where: {
                  isActive: true,
                  stock: { gt: 0 }
                }
              } 
            } 
          } 
        },
        orderBy: { name: 'asc' }
      }),
      
      // بنرهای فعال
      prisma.banner.findMany({ 
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      // محصولات ویژه
      prisma.product.findMany({
        where: { 
          isFeatured: true, 
          isActive: true,
          stock: { gt: 0 }
        },
        take: 8,
        include: { 
          sizes: true, 
          colors: true,
          reviews: {
            select: { rating: true },
            where: { isApproved: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // برندها
      prisma.product.findMany({
        where: { 
          brand: { not: null }, 
          isActive: true 
        },
        distinct: ['brand'],
        select: { brand: true }
      }),

      // آخرین اخبار ورزشی (۴ خبر برای صفحه اصلی)
      prisma.sportsNews.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          summary: true,
          imageUrl: true,
          createdAt: true,
          viewCount: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // فرمت محصولات ویژه
    const featuredProductsWithDetails = featuredProducts.map(product => {
      const avgRating = product.reviews.length > 0 
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length 
        : 0;
      
      const finalPrice = product.price * (1 - product.discountPercent / 100);
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPercent: product.discountPercent,
        finalPrice: Math.round(finalPrice),
        imageUrl: product.imageUrl,
        brand: product.brand,
        hasDiscount: product.discountPercent > 0,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
        stock: product.stock,
        sizes: product.sizes,
        colors: product.colors
      };
    });

    // فرمت اخبار ورزشی
    const formattedSportsNews = sportsNews.map(news => ({
      id: news.id,
      title: news.title,
      summary: news.summary,
      imageUrl: news.imageUrl,
      viewCount: news.viewCount,
      createdAt: news.createdAt.toISOString(),
      date: formatToJalali(news.createdAt),
      timeAgo: getTimeAgo(news.createdAt)
    }));

    res.json({
      success: true,
      data: {
        categories,
        banners,
        featuredProducts: featuredProductsWithDetails,
        brands: brands.map(b => b.brand).filter(Boolean),
        sportsNews: formattedSportsNews,
        config: {
          currency: 'IRT',
          maxCartItems: 50,
          features: {
            sizes: true,
            colors: true,
            reviews: true,
            wishlist: true
          },
          shipping: {
            freeShippingThreshold: 500000,
            standardShippingCost: 25000
          }
        }
      }
    });
  } catch (err) {
    console.error('Frontend init error:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت داده‌های اولیه'
    });
  }
});

/**
 * @swagger
 * /api/frontend/sports-news:
 *   get:
 *     summary: دریافت لیست اخبار ورزشی با صفحه‌بندی
 *     description: دریافت تمام اخبار ورزشی فعال با امکان صفحه‌بندی
 *     tags: [Frontend]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: شماره صفحه
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: تعداد آیتم در هر صفحه
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: جستجو در عنوان و محتوای اخبار
 *     responses:
 *       200:
 *         description: لیست اخبار ورزشی دریافت شد
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
 *                     news:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           summary:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           viewCount:
 *                             type: integer
 *                           timeAgo:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: خطای سرور
 */
router.get('/sports-news', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // شرط جستجو
    const where = { isActive: true };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [news, total] = await Promise.all([
      prisma.sportsNews.findMany({
        where,
        select: {
          id: true,
          title: true,
          summary: true,
          imageUrl: true,
          createdAt: true,
          viewCount: true,
          tags: true
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: Number(limit)
      }),
      prisma.sportsNews.count({ where })
    ]);

    // فرمت اخبار
    const formattedNews = news.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      date: formatToJalali(item.createdAt),
      timeAgo: getTimeAgo(item.createdAt),
      tags: item.tags || []
    }));

    res.json({
      success: true,
      data: {
        news: formattedNews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (err) {
    console.error('Sports news error:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت اخبار ورزشی'
    });
  }
});

/**
 * @swagger
 * /api/frontend/sports-news/latest:
 *   get:
 *     summary: دریافت آخرین اخبار ورزشی
 *     description: دریافت جدیدترین اخبار ورزشی برای نمایش در بخش‌های مختلف سایت
 *     tags: [Frontend]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: تعداد اخبار برای دریافت
 *     responses:
 *       200:
 *         description: آخرین اخبار ورزشی دریافت شد
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
 *                       title:
 *                         type: string
 *                       summary:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       timeAgo:
 *                         type: string
 *       500:
 *         description: خطای سرور
 */
router.get('/sports-news/latest', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const news = await prisma.sportsNews.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        createdAt: true,
        viewCount: true
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    const formattedNews = news.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      date: formatToJalali(item.createdAt),
      timeAgo: getTimeAgo(item.createdAt)
    }));

    res.json({
      success: true,
      data: formattedNews
    });
  } catch (err) {
    console.error('Latest sports news error:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت آخرین اخبار'
    });
  }
});

/**
 * @swagger
 * /api/frontend/sports-news/popular:
 *   get:
 *     summary: دریافت پربازدیدترین اخبار ورزشی
 *     description: دریافت اخبار ورزشی بر اساس تعداد بازدید
 *     tags: [Frontend]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: تعداد اخبار برای دریافت
 *     responses:
 *       200:
 *         description: پربازدیدترین اخبار دریافت شد
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
 *                       title:
 *                         type: string
 *                       summary:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       viewCount:
 *                         type: integer
 *                       timeAgo:
 *                         type: string
 *       500:
 *         description: خطای سرور
 */
router.get('/sports-news/popular', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const news = await prisma.sportsNews.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        createdAt: true,
        viewCount: true
      },
      orderBy: { viewCount: 'desc' },
      take: Number(limit)
    });

    const formattedNews = news.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      date: formatToJalali(item.createdAt),
      timeAgo: getTimeAgo(item.createdAt)
    }));

    res.json({
      success: true,
      data: formattedNews
    });
  } catch (err) {
    console.error('Popular sports news error:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت پربازدیدترین اخبار'
    });
  }
});

/**
 * @swagger
 * /api/frontend/sports-news/{id}:
 *   get:
 *     summary: دریافت جزئیات کامل یک خبر ورزشی
 *     description: دریافت محتوای کامل یک خبر ورزشی و افزایش تعداد بازدید
 *     tags: [Frontend]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: آیدی خبر ورزشی
 *     responses:
 *       200:
 *         description: جزئیات خبر ورزشی دریافت شد
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
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     author:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     viewCount:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                     date:
 *                       type: string
 *       404:
 *         description: خبر ورزشی یافت نشد
 *       500:
 *         description: خطای سرور
 */
router.get('/sports-news/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const news = await prisma.sportsNews.findUnique({
      where: { id }
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'خبر ورزشی یافت نشد'
      });
    }

    // افزایش تعداد بازدید
    await prisma.sportsNews.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      success: true,
      data: {
        ...news,
        createdAt: news.createdAt.toISOString(),
        date: formatToJalali(news.createdAt)
      }
    });
  } catch (err) {
    console.error('Sports news detail error:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت جزئیات خبر'
    });
  }
});

/**
 * @swagger
 * /api/frontend/newest-sports-shoes:
 *   get:
 *     summary: دریافت جدیدترین کفش‌های ورزشی
 *     description: دریافت لیست جدیدترین کفش‌های ورزشی اضافه شده به سایت
 *     tags: [Frontend]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: تعداد محصولات برای نمایش
 *     responses:
 *       200:
 *         description: لیست کفش‌های ورزشی دریافت شد
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
 *                       price:
 *                         type: number
 *                       finalPrice:
 *                         type: number
 *                       imageUrl:
 *                         type: string
 *                       brand:
 *                         type: string
 *                       hasDiscount:
 *                         type: boolean
 *                       category:
 *                         type: object
 *                       sizes:
 *                         type: array
 *                       colors:
 *                         type: array
 *       500:
 *         description: خطای سرور
 */
router.get('/newest-sports-shoes', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        OR: [
          { category: { name: { contains: 'کفش ورزشی' } } },
          { name: { contains: 'کفش', mode: 'insensitive' } },
          { description: { contains: 'کفش', mode: 'insensitive' } }
        ]
      },
      include: {
        sizes: true,
        colors: true,
        category: true,
        reviews: {
          select: { rating: true },
          where: { isApproved: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    const productsWithDetails = products.map(product => {
      const avgRating = product.reviews.length > 0 
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
        : 0;
      
      const finalPrice = product.price * (1 - product.discountPercent / 100);
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPercent: product.discountPercent,
        finalPrice: Math.round(finalPrice),
        imageUrl: product.imageUrl,
        brand: product.brand,
        hasDiscount: product.discountPercent > 0,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
        stock: product.stock,
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        isNew: new Date() - new Date(product.createdAt) < 7 * 24 * 60 * 60 * 1000 // جدیدتر از 7 روز
      };
    });

    res.json({
      success: true,
      data: productsWithDetails
    });
  } catch (err) {
    console.error('Newest sports shoes error:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطا در دریافت کفش‌های ورزشی'
    });
  }
});

// توابع کمکی

// تابع نمایش زمان گذشته
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'همین الان';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه قبل`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت قبل`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} روز قبل`;
  
  return `${Math.floor(diffInSeconds / 2592000)} ماه قبل`;
}

// تابع تبدیل تاریخ به فرمت شمسی ساده
function formatToJalali(date) {
  const gregorianDate = new Date(date);
  const options = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  return gregorianDate.toLocaleDateString('fa-IR', options);
}

module.exports = router;