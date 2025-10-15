// src/controllers/userController.js - جدید
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile with complete information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        nationalCode: true,    // جدید
        birthDate: true,       // جدید  
        gender: true,          // جدید
        isVerified: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    logger.error('Get user profile failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to retrieve user profile' });
  }
};

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile with new fields
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               nationalCode:
 *                 type: string
 *                 example: "1234567890"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, nationalCode, birthDate, gender } = req.body;
    
    // اعتبارسنجی کد ملی (۱۰ رقمی)
    if (nationalCode && !/^\d{10}$/.test(nationalCode)) {
      return res.status(400).json({ message: 'کد ملی باید ۱۰ رقم باشد' });
    }

    // اعتبارسنجی جنسیت
    if (gender && !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'جنسیت باید male یا female باشد' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        firstName, 
        lastName, 
        phoneNumber,
        nationalCode,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true, 
        phoneNumber: true,
        nationalCode: true,
        birthDate: true,
        gender: true,
        isVerified: true 
      }
    });

    logger.info('User profile updated', { userId: req.user.id });
    res.json(user);
  } catch (err) {
    logger.error('Update user profile failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};