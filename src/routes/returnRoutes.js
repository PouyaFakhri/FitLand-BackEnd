// src/routes/returnRoutes.js - نسخه کامل اصلاح شده
const express = require('express');
const { 
  createReturnRequest, 
  getUserReturns, 
  getReturnById, 
  getAllReturns, 
  updateReturnStatus,
  cancelReturnRequest
} = require('../controllers/returnController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateParams } = require('../utils/validation');
const { 
  returnRequestSchema, 
  updateReturnStatusSchema,
  uuidParamSchema
} = require('../utils/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Returns
 *   description: مدیریت بازگشت کالا - Returns Management
 */

/**
 * @swagger
 * /api/returns:
 *   post:
 *     summary: Create Return Request
 *     description: ایجاد درخواست بازگشت - Create return request
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *               - items
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - orderItemId
 *                     - quantity
 *                     - returnReason
 *                   properties:
 *                     orderItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     returnReason:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 200
 *     responses:
 *       201:
 *         description: درخواست بازگشت ایجاد شد - Return request created
 *       400:
 *         description: خطا در ایجاد درخواست - Error creating request
 */
router.post('/', authMiddleware(), validate(returnRequestSchema), createReturnRequest);

/**
 * @swagger
 * /api/returns:
 *   get:
 *     summary: Get User Returns
 *     description: دریافت درخواست‌های بازگشت کاربر - Get user's return requests
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, COMPLETED, REFUNDED, CANCELLED]
 *     responses:
 *       200:
 *         description: درخواست‌های بازگشت دریافت شدند - Return requests retrieved
 */
router.get('/', authMiddleware(), getUserReturns);

/**
 * @swagger
 * /api/returns/{id}:
 *   get:
 *     summary: Get Return by ID
 *     description: دریافت جزئیات درخواست بازگشت - Get return request details
 *     tags: [Returns]
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
 *         description: جزئیات دریافت شد - Details retrieved
 *       404:
 *         description: درخواست یافت نشد - Request not found
 */
router.get('/:id', authMiddleware(), validateParams(uuidParamSchema), getReturnById);

/**
 * @swagger
 * /api/returns/{id}/cancel:
 *   put:
 *     summary: Cancel Return Request
 *     description: لغو درخواست بازگشت - Cancel return request
 *     tags: [Returns]
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
 *         description: درخواست لغو شد - Request cancelled
 *       400:
 *         description: امکان لغو وجود ندارد - Cannot cancel
 */
router.put('/:id/cancel', authMiddleware(), validateParams(uuidParamSchema), cancelReturnRequest);

/**
 * @swagger
 * /api/returns/admin/returns:
 *   get:
 *     summary: Get All Returns (Admin)
 *     description: دریافت تمام درخواست‌های بازگشت (ادمین) - Get all return requests (Admin)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: لیست درخواست‌ها دریافت شد - Requests retrieved
 */
router.get('/admin/returns', authMiddleware(['ADMIN']), getAllReturns);

/**
 * @swagger
 * /api/returns/admin/returns/{id}/status:
 *   put:
 *     summary: Update Return Status (Admin)
 *     description: به‌روزرسانی وضعیت درخواست (ادمین) - Update request status (Admin)
 *     tags: [Returns]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, COMPLETED, REFUNDED]
 *               adminNotes:
 *                 type: string
 *                 maxLength: 1000
 *               refundAmount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: وضعیت به‌روزرسانی شد - Status updated
 */
router.put('/admin/returns/:id/status', authMiddleware(['ADMIN']), validateParams(uuidParamSchema), validate(updateReturnStatusSchema), updateReturnStatus);

module.exports = router;