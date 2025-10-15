// src/controllers/wishlistController.js - Added pagination
const prisma = require('../config/db');

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
const getWishlist = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [wishlist, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId: req.user.id },
        include: {
          product: {
            include: {
              sizes: true,
              colors: true,
              category: true,
              _count: {
                select: {
                  reviews: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.wishlist.count({ where: { userId: req.user.id } })
    ]);

    // اضافه کردن قیمت نهایی با تخفیف
    const wishlistWithDiscount = wishlist.map(item => ({
      ...item,
      product: {
        ...item.product,
        finalPrice: item.product.price * (1 - item.product.discountPercent / 100),
        hasDiscount: item.product.discountPercent > 0
      }
    }));

    res.json({
      items: wishlistWithDiscount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add product to wishlist
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
 *     responses:
 *       201:
 *         description: Product added to wishlist
 *       400:
 *         description: Product already in wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // بررسی وجود محصول
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // بررسی وجود محصول در علاقه‌مندی‌ها
    const existing = await prisma.wishlist.findFirst({
      where: { userId: req.user.id, productId }
    });

    if (existing) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        productId
      },
      include: {
        product: {
          include: {
            sizes: true,
            colors: true,
            category: true
          }
        }
      }
    });

    // اضافه کردن قیمت نهایی با تخفیف
    const wishlistItemWithDiscount = {
      ...wishlistItem,
      product: {
        ...wishlistItem.product,
        finalPrice: wishlistItem.product.price * (1 - wishlistItem.product.discountPercent / 100),
        hasDiscount: wishlistItem.product.discountPercent > 0
      }
    };

    res.status(201).json(wishlistItemWithDiscount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
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
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Product not found in wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await prisma.wishlist.findFirst({
      where: { userId: req.user.id, productId }
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    await prisma.wishlist.delete({
      where: { id: wishlistItem.id }
    });

    res.json({ message: 'Product removed from wishlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};