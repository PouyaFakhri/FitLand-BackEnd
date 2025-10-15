const express = require('express');
const { getCategories, getCategoryProducts } = require('../controllers/categoryController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: مدیریت دسته‌بندی‌ها - Categories Management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get All Categories
 *     description: دریافت لیست تمام دسته‌بندی‌ها - Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: لیست دسته‌بندی‌ها دریافت شد - Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: شناسه دسته‌بندی - Category ID
 *                   name:
 *                     type: string
 *                     description: نام دسته‌بندی - Category name
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                     description: آدرس تصویر - Image URL
 *                   description:
 *                     type: string
 *                     description: توضیحات - Description
 *                   productCount:
 *                     type: integer
 *                     description: تعداد محصولات - Product count
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories/{id}/products:
 *   get:
 *     summary: Get Category Products
 *     description: دریافت محصولات یک دسته‌بندی - Get products by category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه دسته‌بندی - Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: شماره صفحه - Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: تعداد در هر صفحه - Items per page
 *     responses:
 *       200:
 *         description: محصولات دسته‌بندی دریافت شدند - Category products retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: تعداد کل - Total count
 *                 page:
 *                   type: integer
 *                   description: شماره صفحه - Page number
 *                 limit:
 *                   type: integer
 *                   description: تعداد در صفحه - Items per page
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/:id/products', getCategoryProducts);

module.exports = router;