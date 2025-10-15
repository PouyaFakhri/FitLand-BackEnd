const express = require('express');
const prisma = require('../config/db');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Frontend
 *   description: داده‌های اولیه فرانت‌اند - Frontend Initial Data
 */

/**
 * @swagger
 * /api/frontend/init:
 *   get:
 *     summary: Get Frontend Initial Data
 *     description: دریافت داده‌های اولیه برای فرانت‌اند - Get initial data for frontend
 *     tags: [Frontend]
 *     responses:
 *       200:
 *         description: داده‌های اولیه دریافت شد - Initial data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       description:
 *                         type: string
 *                       _count:
 *                         type: object
 *                         properties:
 *                           products:
 *                             type: integer
 *                 banners:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       link:
 *                         type: string
 *                 featuredProducts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 brands:
 *                   type: array
 *                   items:
 *                     type: string
 *                 config:
 *                   type: object
 *                   properties:
 *                     currency:
 *                       type: string
 *                       example: "IRT"
 *                     maxCartItems:
 *                       type: integer
 *                       example: 50
 *                     features:
 *                       type: object
 *                       properties:
 *                         sizes:
 *                           type: boolean
 *                         colors:
 *                           type: boolean
 *                         reviews:
 *                           type: boolean
 */
router.get('/init', async (req, res) => {
  try {
    const [categories, banners, featuredProducts, brands] = await Promise.all([
      prisma.category.findMany({
        include: { _count: { select: { products: true } } }
      }),
      prisma.banner.findMany({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isFeatured: true, isActive: true },
        take: 8,
        include: { sizes: true, colors: true }
      }),
      prisma.product.findMany({
        where: { brand: { not: null }, isActive: true },
        distinct: ['brand'],
        select: { brand: true }
      })
    ]);

    res.json({
      categories,
      banners,
      featuredProducts,
      brands: brands.map(b => b.brand).filter(Boolean),
      config: {
        currency: 'IRT',
        maxCartItems: 50,
        features: {
          sizes: true,
          colors: true,
          reviews: true
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;