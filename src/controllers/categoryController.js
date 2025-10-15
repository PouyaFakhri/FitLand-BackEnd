// src/controllers/categoryController.js
const prisma = require('../config/db');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   description:
 *                     type: string
 *                   productCount:
 *                     type: integer
 */
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // ساخت response با تعداد محصولات
    const categoriesWithCount = categories.map(category => ({
      id: category.id,
      name: category.name,
      imageUrl: category.imageUrl,
      description: category.description,
      productCount: category._count.products
    }));

    res.json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/categories/{id}/products:
 *   get:
 *     summary: Get products by category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Products in category
 */
const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await prisma.product.findMany({
      where: { categoryId: id },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.product.count({
      where: { categoryId: id }
    });

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      items: products
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCategories,
  getCategoryProducts
};