const express = require('express');
const { 
  advancedSearch, 
  getSearchSuggestions, 
  getAvailableFilters 
} = require('../controllers/searchController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: جستجوی پیشرفته - Advanced Search
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Advanced Product Search
 *     description: جستجوی پیشرفته محصولات با فیلترها - Advanced product search with filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: عبارت جستجو - Search query
 *         example: "کفش ورزشی"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: فیلتر دسته‌بندی - Category filter
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: فیلتر برند - Brand filter
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: حداقل قیمت - Minimum price
 *         example: 100000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: حداکثر قیمت - Maximum price
 *         example: 500000
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: فقط محصولات موجود - Only in-stock products
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [relevance, newest, price-low, price-high, popular]
 *           default: relevance
 *         description: مرتب‌سازی - Sort order
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
 *           default: 12
 *         description: تعداد در هر صفحه - Items per page
 *     responses:
 *       200:
 *         description: نتایج جستجو دریافت شد - Search results retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                   description: عبارت جستجو - Search query
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalResults:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *                   description: فیلترهای اعمال شده - Applied filters
 *                 filterStats:
 *                   type: object
 *                   description: آمار فیلترها - Filter statistics
 */
router.get('/', advancedSearch);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get Search Suggestions
 *     description: دریافت پیشنهادات جستجو - Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: عبارت جستجو - Search query
 *         example: "کفش"
 *     responses:
 *       200:
 *         description: پیشنهادات جستجو دریافت شدند - Search suggestions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: "product"
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: "category"
 *                 brands:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: "brand"
 */
router.get('/suggestions', getSearchSuggestions);

/**
 * @swagger
 * /api/search/filters:
 *   get:
 *     summary: Get Available Search Filters
 *     description: دریافت فیلترهای قابل استفاده در جستجو - Get available search filters
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: فیلترهای موجود دریافت شدند - Available filters retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                 brands:
 *                   type: array
 *                   items:
 *                     type: string
 *                 priceRange:
 *                   type: object
 *                   properties:
 *                     min:
 *                       type: number
 *                     max:
 *                       type: number
 *                 sizes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 colors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       color:
 *                         type: string
 *                       colorCode:
 *                         type: string
 */
router.get('/filters', getAvailableFilters);

module.exports = router;