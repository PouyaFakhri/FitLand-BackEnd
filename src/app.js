require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ایجاد اپ
const app = express();

// Middlewareهای امنیتی
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// پارسینگ درخواست‌ها
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Swagger مستندات
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FitLand API',
      version: '2.2.1',
      description: 'Complete Sports E-commerce Backend API',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8081}`,
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate limiting
const { generalLimiter, authLimiter } = require('./middleware/rateLimit');
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// روت‌ها
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth-enhanced', require('./routes/authEnhancedRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/user/dashboard', require('./routes/userDashboardRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/frontend', require('./routes/frontendRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/orders/tracking', require('./routes/orderTrackingRoutes'));
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', require('./routes/testRoutes'));
}

// روت سلامت
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.2.1'
  });
});

// روت اصلی
app.get('/', (req, res) => {
  res.json({
    message: '🚀 FitLand Sports Store API is running!',
    version: '2.2.1',
    documentation: '/api-docs',
    health: '/health'
  });
});

// هندلینگ خطا
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// --- START SERVER اگر مستقیم اجرا شود ---
if (require.main === module) {
  const PORT = process.env.PORT || 8081;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
module.exports = app;
