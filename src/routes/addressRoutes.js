// src/routes/addressRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { 
  getAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress 
} = require('../controllers/addressController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateParams } = require('../utils/validation');
const { addressSchema, uuidParamSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: مدیریت آدرس‌های کاربران - User Addresses Management
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get User Addresses
 *     description: دریافت لیست آدرس‌های کاربر - Get user's addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست آدرس‌ها دریافت شد - Addresses retrieved successfully
 */
router.get('/', authMiddleware(), getAddresses);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create New Address
 *     description: ایجاد آدرس جدید - Create new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - province
 *               - city
 *               - postalCode
 *               - address
 *               - recipientName
 *               - recipientPhone
 *             properties:
 *               title:
 *                 type: string
 *                 example: "آدرس خانه"
 *               province:
 *                 type: string
 *                 example: "تهران"
 *               city:
 *                 type: string
 *                 example: "تهران"
 *               postalCode:
 *                 type: string
 *                 example: "1234567890"
 *               address:
 *                 type: string
 *                 example: "خیابان ولیعصر، پلاک 100"
 *               recipientName:
 *                 type: string
 *                 example: "علی محمدی"
 *               recipientPhone:
 *                 type: string
 *                 example: "09121234567"
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: آدرس با موفقیت ایجاد شد - Address created successfully
 */
router.post('/', authMiddleware(), validate(addressSchema), createAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update Address
 *     description: به‌روزرسانی آدرس - Update address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *               province:
 *                 type: string
 *               city:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               address:
 *                 type: string
 *               recipientName:
 *                 type: string
 *               recipientPhone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: آدرس به‌روزرسانی شد - Address updated successfully
 *       404:
 *         description: آدرس یافت نشد - Address not found
 */
router.put('/:id', authMiddleware(), validateParams(uuidParamSchema), validate(addressSchema.partial()), updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete Address
 *     description: حذف آدرس - Delete address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: آدرس حذف شد - Address deleted successfully
 *       404:
 *         description: آدرس یافت نشد - Address not found
 */
router.delete('/:id', authMiddleware(), validateParams(uuidParamSchema), deleteAddress);

module.exports = router;