// src/controllers/addressController.js - جدید
const prisma = require('../config/db');

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get user addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User addresses retrieved successfully
 */
const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' }
    });

    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create new address
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
 *                 example: "خراسان شمالی"
 *               city:
 *                 type: string
 *                 example: "بجنورد"
 *               postalCode:
 *                 type: string
 *                 example: "1234567890"
 *               address:
 *                 type: string
 *                 example: "میدان شهید، بین شهید و 17 شهریور، کوچه عزیز مصر، پلاک 13"
 *               recipientName:
 *                 type: string
 *                 example: "مهسا شیرین زبان"
 *               recipientPhone:
 *                 type: string
 *                 example: "09014892023"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Address created successfully
 */
const createAddress = async (req, res) => {
  try {
    const { 
      title = "آدرس اصلی", 
      province, 
      city, 
      postalCode, 
      address, 
      recipientName, 
      recipientPhone, 
      isDefault = false 
    } = req.body;

    // اگر آدرس جدید به عنوان پیش‌فرض تنظیم شده، بقیه آدرس‌ها رو از حالت پیش‌فرض خارج کن
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const addressRecord = await prisma.address.create({
      data: {
        userId: req.user.id,
        title,
        province,
        city,
        postalCode,
        address,
        recipientName,
        recipientPhone,
        isDefault
      }
    });

    res.status(201).json(addressRecord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Address updated successfully
 */
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      province, 
      city, 
      postalCode, 
      address, 
      recipientName, 
      recipientPhone, 
      isDefault 
    } = req.body;

    // بررسی مالکیت آدرس
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // اگر آدرس به عنوان پیش‌فرض تنظیم شده، بقیه آدرس‌ها رو از حالت پیش‌فرض خارج کن
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        title,
        province,
        city,
        postalCode,
        address,
        recipientName,
        recipientPhone,
        isDefault
      }
    });

    res.json(updatedAddress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // بررسی مالکیت آدرس
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id }
    });

    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};