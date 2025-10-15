// src/controllers/bannerController.js
const prisma = require('../config/db');

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get all active banners
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of active banners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   link:
 *                     type: string
 */
const getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create a new banner (Admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               link:
 *                 type: string
 *               isActive:
 *                 type: boolean
 */
const createBanner = async (req, res) => {
  try {
    const { title, imageUrl, link, isActive = true } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        link,
        isActive
      }
    });

    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBanners,
  createBanner
};