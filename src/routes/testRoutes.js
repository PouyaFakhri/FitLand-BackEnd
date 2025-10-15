// src/routes/testRoutes.js
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Test
 *   description: تست و توسعه - Test and Development
 */

/**
 * @swagger
 * /api/test/verification-codes:
 *   get:
 *     summary: Get recent verification codes (Development only)
 *     description: دریافت کدهای تایید اخیر (فقط برای محیط توسعه) - Get recent verification codes (Development only)
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: لیست کدهای تایید دریافت شد - Verification codes retrieved
 */
router.get('/verification-codes', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }

    const users = await require('../config/db').user.findMany({
      where: {
        verificationCode: { not: null }
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        verificationCode: true,
        verificationCodeExpires: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      codes: users,
      currentTime: new Date().toISOString(),
      total: users.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/test/generate-code:
 *   post:
 *     summary: Generate test verification code
 *     description: تولید کد تایید تست برای کاربر خاص - Generate test verification code for specific user
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: کد تست تولید شد - Test code generated
 */
router.post('/generate-code', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }

    const { email, phoneNumber } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    let user;
    if (email) {
      user = await require('../config/db').user.findUnique({ where: { email } });
    } else if (phoneNumber) {
      user = await require('../config/db').user.findUnique({ where: { phoneNumber } });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // تولید کد تست
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 دقیقه برای تست

    await require('../config/db').user.update({
      where: { id: user.id },
      data: { 
        verificationCode: code, 
        verificationCodeExpires: expiresAt 
      }
    });

    res.json({
      message: 'Test verification code generated',
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber
      },
      code: code,
      expiresAt: expiresAt,
      expiresIn: '10 minutes'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;