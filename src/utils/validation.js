const { z } = require('zod');

// ==================== Schemas مشترک ====================
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const uuidSchema = z.string().uuid();

const uuidParamSchema = z.object({
  id: z.string().uuid()
});

// ==================== Schemas محصول ====================
const productSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  brand: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  discountExpiresAt: z.string().datetime().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

const productUpdateSchema = productSchema.partial();

const productSizeSchema = z.object({
  size: z.string().min(1).max(20).trim(),
  stock: z.coerce.number().int().min(0)
});

const productColorSchema = z.object({
  color: z.string().min(1).max(50).trim(),
  colorCode: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color code format'),
  imageUrl: z.string().url().optional()
});

// ==================== Schemas کاربر ====================
const userRegistrationSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
});

const userLoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  device: z.string().optional()
});

const userUpdateSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phoneNumber: z.string().regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number').optional(),
  nationalCode: z.string().length(10).regex(/^\d+$/, 'National code must be 10 digits').optional(),
  birthDate: z.string().datetime().optional().refine(date => {
    if (!date) return true;
    const birth = new Date(date);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    return birth < now && age >= 13 && age <= 120;
  }, 'Birth date must be valid (age 13-120)'),
  gender: z.enum(['male', 'female']).optional()
});

// ==================== Schemas سفارش ====================
const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(100),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(50).optional().nullable()
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  address: z.string().min(10).max(500).trim(),
  paymentMethod: z.enum(['ONLINE', 'CASH_ON_DELIVERY']).default('ONLINE').optional()
});

// ==================== Schemas سبد خرید ====================
const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(100),
  size: z.string().max(20).optional().nullable(),
  color: z.string().max(50).optional().nullable()
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(100)
});

const cartItemIdParamSchema = z.object({
  itemId: z.string().uuid()
});

// ==================== Schemas آدرس ====================
const addressSchema = z.object({
  title: z.string().max(100).trim().default('آدرس اصلی'),
  province: z.string().max(100).trim(),
  city: z.string().max(100).trim(),
  postalCode: z.string().max(20).regex(/^\d{10}$/, 'Postal code must be 10 digits'),
  address: z.string().min(10).max(500).trim(),
  recipientName: z.string().max(100).trim(),
  recipientPhone: z.string().regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number'),
  isDefault: z.boolean().default(false),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

// ==================== Schemas جستجو ====================
const searchSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  onSale: z.coerce.boolean().optional(),
  sort: z.enum(['relevance', 'newest', 'price-low', 'price-high', 'popular']).default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12)
});

// ==================== Schemas کوپن ====================
const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true)
});

const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
  cartTotal: z.coerce.number().positive()
});

// ==================== Schemas بازگشت کالا ====================
const returnItemSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  returnReason: z.string().min(5).max(200).trim()
});

const returnRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10).max(500).trim(),
  items: z.array(returnItemSchema).min(1)
});

const updateReturnStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED', 'REFUNDED']),
  adminNotes: z.string().max(1000).optional(),
  refundAmount: z.coerce.number().min(0).optional()
});

// ==================== Schemas نظرات ====================
const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(3).optional()
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  text: z.string().max(500).optional(),
  images: z.array(z.string().url()).max(3).optional()
});

const reviewIdParamSchema = z.object({
  reviewId: z.string().uuid()
});

// ==================== Schemas لیست علاقه‌مندی ====================
const wishlistSchema = z.object({
  productId: z.string().uuid()
});

const wishlistProductIdParamSchema = z.object({
  productId: z.string().uuid()
});

// ==================== Schemas پرداخت ====================
const paymentIntentSchema = z.object({
  orderId: z.string().uuid()
});

const mockPaymentSchema = z.object({
  orderId: z.string().uuid()
});

const cashOnDeliverySchema = z.object({
  orderId: z.string().uuid()
});

// ==================== Schemas خبرنامه ====================
const newsletterSubscribeSchema = z.object({
  email: z.string().email().trim().toLowerCase()
});

const newsletterUnsubscribeSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  token: z.string().min(32)
});

const newsletterBroadcastSchema = z.object({
  subject: z.string().min(5).max(200).trim(),
  content: z.string().min(10).max(10000).trim()
});

// ==================== Schemas احراز هویت پیشرفته ====================
const sendVerificationCodeSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional()
}).refine((data) => data.email || data.phoneNumber, {
  message: 'Email or phone number is required'
});

const verifyCodeSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  code: z.string().length(5).regex(/^\d+$/, 'Code must be 5 digits')
}).refine((data) => data.email || data.phoneNumber, {
  message: 'Email or phone number is required'
});

const registerWithPhoneSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  phoneNumber: z.string().regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number'),
  email: z.string().email().optional()
});

const resetPasswordSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  code: z.string().length(5).regex(/^\d+$/),
  newPassword: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase, uppercase and digit'
  })
}).refine((data) => data.email || data.phoneNumber, {
  message: 'Email or phone number is required'
});

// ==================== Middleware validation ====================
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      next(error);
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.query);
      req.query = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(422).json({
          success: false,
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details
          }
        });
      }
      
      next(error);
    }
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.params);
      req.params = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(422).json({
          success: false,
          error: {
            code: 'PARAMS_VALIDATION_ERROR',
            message: 'Invalid URL parameters',
            details
          }
        });
      }
      
      next(error);
    }
  };
};

// ==================== Exports ====================
module.exports = {
  // Schemas مشترک
  paginationSchema,
  uuidSchema,
  uuidParamSchema,
  
  // Schemas محصول
  productSchema,
  productUpdateSchema,
  productSizeSchema,
  productColorSchema,
  
  // Schemas کاربر
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  
  // Schemas سفارش
  orderSchema,
  orderItemSchema,
  
  // Schemas سبد خرید
  addToCartSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
  
  // Schemas آدرس
  addressSchema,
  
  // Schemas جستجو
  searchSchema,
  
  // Schemas کوپن
  couponSchema,
  validateCouponSchema,
  
  // Schemas بازگشت کالا
  returnRequestSchema,
  returnItemSchema,
  updateReturnStatusSchema,
  
  // Schemas نظرات
  reviewSchema,
  updateReviewSchema,
  reviewIdParamSchema,
  
  // Schemas لیست علاقه‌مندی
  wishlistSchema,
  wishlistProductIdParamSchema,
  
  // Schemas پرداخت
  paymentIntentSchema,
  mockPaymentSchema,
  cashOnDeliverySchema,
  
  // Schemas خبرنامه
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  newsletterBroadcastSchema,
  
  // Schemas احراز هویت پیشرفته
  sendVerificationCodeSchema,
  verifyCodeSchema,
  registerWithPhoneSchema,
  resetPasswordSchema,
  
  // Middlewares
  validate,
  validateQuery,
  validateParams
};