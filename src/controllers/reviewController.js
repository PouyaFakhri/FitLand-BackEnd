const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Add a review for a product
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               text:
 *                 type: string
 *                 maxLength: 500
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid rating or product not found
 */
const addReview = async (req, res) => {
  try {
    const { productId, rating, text, images = [] } = req.body;
    
    // بررسی اینکه کاربر محصول را خریداری کرده
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        items: { 
          some: { 
            productId: productId 
          } 
        },
        status: { in: ['COMPLETED', 'SHIPPED'] }
      }
    });

    if (!hasPurchased) {
      return res.status(400).json({ 
        message: 'Only customers who purchased this product can submit reviews' 
      });
    }

    // بررسی اینکه کاربر قبلاً برای این محصول نظر داده
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: req.user.id,
        productId: productId
      }
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this product' 
      });
    }

    const review = await prisma.review.create({ 
      data: { 
        productId, 
        rating, 
        text, 
        userId: req.user.id,
        images,
        isApproved: false // نیاز به تایید ادمین
      } 
    });
    
    res.status(201).json(review);
  } catch (err) {
    logger.error('Add review failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to get reviews for
 *       - in: query
 *         name: approvedOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only approved reviews
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   rating:
 *                     type: integer
 *                   text:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   isApproved:
 *                     type: boolean
 *                   user:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
const getReviews = async (req, res) => {
  try {
    const { productId, approvedOnly = true, page = 1, limit = 10 } = req.query;
    
    const where = { productId };
    if (approvedOnly === 'true') {
      where.isApproved = true;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ 
        where,
        include: { 
          user: { 
            select: { 
              firstName: true, 
              lastName: true 
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.review.count({ where })
    ]);

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Get reviews failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               text:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 */
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, text, images } = req.body;

    // بررسی مالکیت نظر
    const existingReview = await prisma.review.findFirst({
      where: { 
        id: reviewId,
        userId: req.user.id 
      }
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { 
        rating, 
        text, 
        images,
        isApproved: false // پس از ویرایش نیاز به تایید مجدد
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(updatedReview);
  } catch (err) {
    logger.error('Update review failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // بررسی مالکیت نظر
    const existingReview = await prisma.review.findFirst({
      where: { 
        id: reviewId,
        userId: req.user.id 
      }
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    logger.error('Delete review failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark review as helpful
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review marked as helpful
 *       404:
 *         description: Review not found
 */
const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 }
      }
    });

    res.json(updatedReview);
  } catch (err) {
    logger.error('Mark helpful failed', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addReview,
  getReviews,
  updateReview,
  deleteReview,
  markHelpful
};