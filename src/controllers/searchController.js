// src/controllers/searchController.js - ساده‌سازی شده بدون الاستیک سرچ
const prisma = require('../config/db');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Advanced product search with filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, newest, price-low, price-high, popular]
 *           default: relevance
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Search results
 */
const advancedSearch = async (req, res) => {
  try {
    const { 
      q, 
      category, 
      brand, 
      minPrice, 
      maxPrice, 
      inStock, 
      sort = 'relevance',
      page = 1, 
      limit = 12 
    } = req.query;
    
    const where = {
      isActive: true
    };

    // جستجوی متنی ساده با Prisma
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } }
      ];
    }

    // فیلترهای اضافی
    if (category) where.categoryId = category;
    if (brand) where.brand = brand;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (inStock === 'true') where.stock = { gt: 0 };

    // مرتب‌سازی
    let orderBy = {};
    switch(sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { salesCount: 'desc' };
        break;
      default: // relevance
        orderBy = { createdAt: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        sizes: true,
        colors: true,
        reviews: {
          select: { rating: true }
        },
        _count: { 
          select: { 
            reviews: true,
          } 
        }
      },
      orderBy,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // محاسبات اضافی برای محصولات
    const productsWithDetails = products.map(product => ({
      ...product,
      avgRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
        : 0,
      finalPrice: product.price * (1 - (product.discountPercent || 0) / 100),
      hasDiscount: (product.discountPercent || 0) > 0,
      discountAmount: product.price * ((product.discountPercent || 0) / 100)
    }));

    const total = await prisma.product.count({ where });

    res.json({
      query: q,
      results: productsWithDetails,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: { 
        category, 
        brand, 
        priceRange: { minPrice, maxPrice },
        inStock: inStock === 'true'
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search suggestions
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const [products, categories, brands] = await Promise.all([
      // پیشنهادات محصولات
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          price: true,
          discountPercent: true
        },
        take: 5
      }),

      // پیشنهادات دسته‌بندی‌ها
      prisma.category.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          imageUrl: true
        },
        take: 3
      }),

      // پیشنهادات برندها
      prisma.product.findMany({
        where: {
          isActive: true,
          brand: { 
            contains: q, 
            mode: 'insensitive',
            not: null
          }
        },
        distinct: ['brand'],
        select: {
          brand: true
        },
        take: 3
      })
    ]);

    const suggestions = {
      products: products.map(p => ({
        ...p,
        type: 'product',
        finalPrice: p.price * (1 - (p.discountPercent || 0) / 100)
      })),
      categories: categories.map(c => ({
        ...c,
        type: 'category'
      })),
      brands: brands.filter(b => b.brand).map(b => ({
        name: b.brand,
        type: 'brand'
      }))
    };

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/search/filters:
 *   get:
 *     summary: Get available search filters
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Available filters
 */
const getAvailableFilters = async (req, res) => {
  try {
    const [categories, brands, priceRange, sizes, colors] = await Promise.all([
      prisma.category.findMany({
        where: { 
          products: { 
            some: { isActive: true } 
          } 
        },
        include: {
          _count: {
            select: { products: { where: { isActive: true } } }
          }
        }
      }),
      prisma.product.findMany({
        where: { 
          isActive: true,
          brand: { not: null }
        },
        distinct: ['brand'],
        select: { brand: true }
      }),
      prisma.product.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.productSize.findMany({
        where: { 
          product: { isActive: true } 
        },
        distinct: ['size'],
        select: { size: true }
      }),
      prisma.productColor.findMany({
        where: { 
          product: { isActive: true } 
        },
        distinct: ['color'],
        select: { color: true, colorCode: true }
      })
    ]);

    res.json({
      categories,
      brands: brands.map(b => b.brand).filter(Boolean),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 1000
      },
      sizes: sizes.map(s => s.size),
      colors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  advancedSearch,
  getSearchSuggestions,
  getAvailableFilters
};