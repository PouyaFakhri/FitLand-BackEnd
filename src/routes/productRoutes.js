const express = require('express');
const { 
  getAll, 
  getById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
  getAvailableProducts,
  getAvailableColors,
  getAvailableSizes,
  getBrands,
  getRelatedProducts,
  getProductStats,
  getOnSaleProducts,
  getProductsWithAdvancedFilters,
  getProductsByCategoryName,
  getProductsByBrand,
  addProductSize,
  addProductColor
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: مدیریت محصولات - Products Management
 */

// Public routes

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get All Products
 *     description: دریافت لیست محصولات با فیلترهای پیشرفته - Get all products with advanced filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: جستجوی متنی - Text search
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: فیلتر بر اساس دسته‌بندی - Filter by category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: فیلتر بر اساس برند - Filter by brand
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: حداقل قیمت - Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: حداکثر قیمت - Maximum price
 *       - in: query
 *         name: onSale
 *         schema:
 *           type: boolean
 *         description: فقط محصولات تخفیف‌دار - Only discounted products
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: فقط محصولات ویژه - Only featured products
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: فقط محصولات موجود - Only available products
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: فیلتر بر اساس رنگ - Filter by color
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: فیلتر بر اساس سایز - Filter by size
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt:desc, createdAt:asc, price:desc, price:asc, salesCount:desc, name:asc, popular:desc]
 *           default: createdAt:desc
 *         description: مرتب‌سازی - Sort order
 *     responses:
 *       200:
 *         description: لیست محصولات دریافت شد - Products retrieved successfully
 */
router.get('/', getAll);

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get Featured Products
 *     description: دریافت محصولات ویژه - Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: تعداد محصولات - Number of products
 *     responses:
 *       200:
 *         description: محصولات ویژه دریافت شدند - Featured products retrieved
 */
router.get('/featured', getFeaturedProducts);

/**
 * @swagger
 * /api/products/best-sellers:
 *   get:
 *     summary: Get Best Selling Products
 *     description: دریافت پرفروش‌ترین محصولات - Get best selling products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: تعداد محصولات - Number of products
 *     responses:
 *       200:
 *         description: پرفروش‌ترین محصولات دریافت شدند - Best sellers retrieved
 */
router.get('/best-sellers', getBestSellers);

/**
 * @swagger
 * /api/products/available:
 *   get:
 *     summary: Get Available Products
 *     description: دریافت محصولات موجود در انبار - Get available products in stock
 *     tags: [Products]
 *     parameters:
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
 *         description: محصولات موجود دریافت شدند - Available products retrieved
 */
router.get('/available', getAvailableProducts);

/**
 * @swagger
 * /api/products/on-sale:
 *   get:
 *     summary: Get Products on Sale
 *     description: دریافت محصولات تخفیف‌دار - Get discounted products
 *     tags: [Products]
 *     parameters:
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
 *         description: محصولات تخفیف‌دار دریافت شدند - On-sale products retrieved
 */
router.get('/on-sale', getOnSaleProducts);

/**
 * @swagger
 * /api/products/colors:
 *   get:
 *     summary: Get Available Colors
 *     description: دریافت لیست رنگ‌های موجود - Get available colors
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: لیست رنگ‌ها دریافت شد - Colors retrieved successfully
 */
router.get('/colors', getAvailableColors);

/**
 * @swagger
 * /api/products/sizes:
 *   get:
 *     summary: Get Available Sizes
 *     description: دریافت لیست سایزهای موجود - Get available sizes
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: لیست سایزها دریافت شد - Sizes retrieved successfully
 */
router.get('/sizes', getAvailableSizes);

/**
 * @swagger
 * /api/products/brands:
 *   get:
 *     summary: Get Available Brands
 *     description: دریافت لیست برندهای موجود - Get available brands
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: لیست برندها دریافت شد - Brands retrieved successfully
 */
router.get('/brands', getBrands);

/**
 * @swagger
 * /api/products/related:
 *   get:
 *     summary: Get Related Products
 *     description: دریافت محصولات مرتبط - Get related products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه دسته‌بندی - Category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: تعداد محصولات - Number of products
 *     responses:
 *       200:
 *         description: محصولات مرتبط دریافت شدند - Related products retrieved
 */
router.get('/related', getRelatedProducts);

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     summary: Get Product Statistics
 *     description: دریافت آمار محصولات - Get product statistics
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: آمار محصولات دریافت شد - Product stats retrieved
 */
router.get('/stats', getProductStats);

/**
 * @swagger
 * /api/products/advanced:
 *   get:
 *     summary: Advanced Product Search
 *     description: جستجوی پیشرفته محصولات - Advanced product search
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categories
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: فیلتر بر اساس دسته‌بندی‌ها - Filter by categories
 *       - in: query
 *         name: brands
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: فیلتر بر اساس برندها - Filter by brands
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: حداقل قیمت - Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: حداکثر قیمت - Maximum price
 *       - in: query
 *         name: sizes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: فیلتر بر اساس سایزها - Filter by sizes
 *       - in: query
 *         name: colors
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: فیلتر بر اساس رنگ‌ها - Filter by colors
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: فقط محصولات موجود - Only in-stock products
 *       - in: query
 *         name: onSale
 *         schema:
 *           type: boolean
 *         description: فقط محصولات تخفیف‌دار - Only discounted products
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, price-low, price-high, popular, rating]
 *           default: newest
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
 */
router.get('/advanced', getProductsWithAdvancedFilters);

/**
 * @swagger
 * /api/products/category/{categoryName}:
 *   get:
 *     summary: Get Products by Category Name
 *     description: دریافت محصولات بر اساس نام دسته‌بندی - Get products by category name
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryName
 *         required: true
 *         schema:
 *           type: string
 *         description: نام دسته‌بندی - Category name
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
 *       404:
 *         description: دسته‌بندی یافت نشد - Category not found
 */
router.get('/category/:categoryName', getProductsByCategoryName);

/**
 * @swagger
 * /api/products/brand/{brandName}:
 *   get:
 *     summary: Get Products by Brand Name
 *     description: دریافت محصولات بر اساس نام برند - Get products by brand name
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: brandName
 *         required: true
 *         schema:
 *           type: string
 *         description: نام برند - Brand name
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
 *         description: محصولات برند دریافت شدند - Brand products retrieved
 */
router.get('/brand/:brandName', getProductsByBrand);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get Product by ID
 *     description: دریافت جزئیات محصول بر اساس شناسه - Get product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *     responses:
 *       200:
 *         description: جزئیات محصول دریافت شد - Product details retrieved
 *       404:
 *         description: محصول یافت نشد - Product not found
 */
router.get('/:id', getById);

// Admin routes

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create New Product (Admin)
 *     description: ایجاد محصول جدید (فقط ادمین) - Create new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: نام محصول - Product name
 *               brand:
 *                 type: string
 *                 description: برند - Brand
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: شناسه دسته‌بندی - Category ID
 *               description:
 *                 type: string
 *                 description: توضیحات - Description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: قیمت - Price
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: درصد تخفیف - Discount percentage
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: موجودی - Stock quantity
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: آدرس تصویر - Image URL
 *               isFeatured:
 *                 type: boolean
 *                 description: آیا محصول ویژه است؟ - Is featured product?
 *               isActive:
 *                 type: boolean
 *                 description: آیا محصول فعال است؟ - Is product active?
 *     responses:
 *       201:
 *         description: محصول با موفقیت ایجاد شد - Product created successfully
 */
router.post('/', authMiddleware(['ADMIN']), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update Product (Admin)
 *     description: به‌روزرسانی محصول (فقط ادمین) - Update product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: نام محصول - Product name
 *               brand:
 *                 type: string
 *                 description: برند - Brand
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: شناسه دسته‌بندی - Category ID
 *               description:
 *                 type: string
 *                 description: توضیحات - Description
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: قیمت - Price
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: درصد تخفیف - Discount percentage
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: موجودی - Stock quantity
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: آدرس تصویر - Image URL
 *               isFeatured:
 *                 type: boolean
 *                 description: آیا محصول ویژه است؟ - Is featured product?
 *               isActive:
 *                 type: boolean
 *                 description: آیا محصول فعال است؟ - Is product active?
 *     responses:
 *       200:
 *         description: محصول با موفقیت به‌روزرسانی شد - Product updated successfully
 *       404:
 *         description: محصول یافت نشد - Product not found
 */
router.put('/:id', authMiddleware(['ADMIN']), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete Product (Admin)
 *     description: حذف محصول (فقط ادمین) - Delete product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *     responses:
 *       200:
 *         description: محصول با موفقیت حذف شد - Product deleted successfully
 *       404:
 *         description: محصول یافت نشد - Product not found
 */
router.delete('/:id', authMiddleware(['ADMIN']), deleteProduct);

/**
 * @swagger
 * /api/products/{id}/sizes:
 *   post:
 *     summary: Add Product Size (Admin)
 *     description: افزودن سایز به محصول (فقط ادمین) - Add size to product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - size
 *               - stock
 *             properties:
 *               size:
 *                 type: string
 *                 description: سایز - Size
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: موجودی سایز - Size stock
 *     responses:
 *       201:
 *         description: سایز با موفقیت اضافه شد - Size added successfully
 */
router.post('/:id/sizes', authMiddleware(['ADMIN']), addProductSize);

/**
 * @swagger
 * /api/products/{id}/colors:
 *   post:
 *     summary: Add Product Color (Admin)
 *     description: افزودن رنگ به محصول (فقط ادمین) - Add color to product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: شناسه محصول - Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - color
 *               - colorCode
 *             properties:
 *               color:
 *                 type: string
 *                 description: نام رنگ - Color name
 *               colorCode:
 *                 type: string
 *                 description: کد رنگ - Color code
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: آدرس تصویر رنگ - Color image URL
 *     responses:
 *       201:
 *         description: رنگ با موفقیت اضافه شد - Color added successfully
 */
router.post('/:id/colors', authMiddleware(['ADMIN']), addProductColor);

module.exports = router;