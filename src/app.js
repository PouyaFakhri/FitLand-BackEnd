require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ایجاد اپ
const app = express();

// Middlewareهای امنیتی
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// پارسینگ درخواست‌ها
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// لاگ درخواست‌ها
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  next();
});

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
      contact: {
        name: 'API Support',
        email: 'support@fitland.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8081}`,
        description: 'Development Server'
      },
      {
        url: `https://api.fitland.com`,
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Error details'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phoneNumber: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN', 'MODERATOR']
            },
            isVerified: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            price: {
              type: 'number',
              format: 'float'
            },
            stock: {
              type: 'integer'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            categoryId: {
              type: 'string',
              format: 'uuid'
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'دسترسی غیرمجاز',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'دسترسی غیرمجاز',
                error: 'Token expired or invalid'
              }
            }
          }
        },
        ValidationError: {
          description: 'خطای اعتبارسنجی',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'داده‌های ورودی نامعتبر',
                error: 'Validation failed'
              }
            }
          }
        },
        NotFoundError: {
          description: 'منبع یافت نشد',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'منبع مورد نظر یافت نشد',
                error: 'Resource not found'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'عملیات احراز هویت و مدیریت کاربران'
      },
      {
        name: 'Products',
        description: 'مدیریت محصولات و موجودی'
      },
      {
        name: 'Categories',
        description: 'مدیریت دسته‌بندی‌ها'
      },
      {
        name: 'Orders',
        description: 'مدیریت سفارشات'
      },
      {
        name: 'Cart',
        description: 'مدیریت سبد خرید'
      },
      {
        name: 'User',
        description: 'مدیریت پروفایل کاربر'
      }
    ]
  },
  apis: [
    './src/routes/*.js', 
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI customization
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "FitLand API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// ارائه فایل‌های Swagger به صورت JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rate limiting
const { generalLimiter, authLimiter, strictLimiter } = require('./middleware/rateLimit');
app.use(generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth/forgot-password', strictLimiter);
app.use('/api/auth/send-verification', strictLimiter);

// روت‌ها
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/sports-news', require('./routes/sportsNewsRoutes'));
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

// روت‌های توسعه - فقط در محیط غیر Production
if (process.env.NODE_ENV !== 'production') {
  console.log('🚀 Development routes enabled');
  app.use('/api/test', require('./routes/testRoutes'));
  
  // روت برای مشاهده متغیرهای محیطی (امن شده)
  app.get('/api/debug/env', (req, res) => {
    const safeEnv = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? '***' : undefined,
      JWT_SECRET: process.env.JWT_SECRET ? '***' : undefined,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      REDIS_URL: process.env.REDIS_URL ? '***' : undefined,
      SMTP_HOST: process.env.SMTP_HOST ? '***' : undefined
    };
    res.json({
      success: true,
      environment: safeEnv,
      timestamp: new Date().toISOString()
    });
  });
}

// روت سلامت
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)} seconds`,
    environment: process.env.NODE_ENV || 'development',
    version: '2.2.1',
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
    }
  };

  // بررسی اتصال به دیتابیس (اگر لازم است)
  res.status(200).json(healthCheck);
});

// روت بررسی وضعیت API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: '🚀 FitLand API is running successfully!',
    version: '2.2.1',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      users: '/api/user',
      documentation: '/api-docs',
      health: '/health'
    },
    statistics: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

// روت اصلی
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 FitLand Sports Store API is running!',
    version: '2.2.1',
    documentation: '/api-docs',
    health: '/health',
    status: '/api/status',
    timestamp: new Date().toISOString()
  });
});

// روت برای مدیریت خطای 404 به صورت زیبا
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      root: '/',
      health: '/health',
      status: '/api/status',
      documentation: '/api-docs',
      authentication: '/api/auth',
      products: '/api/products'
    },
    timestamp: new Date().toISOString()
  });
});

// هندلینگ خطا - باید در انتهای فایل باشد
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📢 ${signal} received, shutting down gracefully...`);
  
  // بستن سرور
  server.close((err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // بستن اتصالات دیتابیس و سایر منابع
    if (typeof prisma !== 'undefined') {
      prisma.$disconnect()
        .then(() => {
          console.log('✅ Database connections closed');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error closing database connections:', err);
          process.exit(1);
        });
    } else {
      process.exit(0);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// ثبت handlers برای graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// هندل کردن unhandled exceptions و rejections
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// --- START SERVER اگر مستقیم اجرا شود ---
let server;
if (require.main === module) {
  const PORT = process.env.PORT || 8081;
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 FitLand API Server Started!
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📚 API Docs: http://localhost:${PORT}/api-docs
❤️ Health Check: http://localhost:${PORT}/health
📊 API Status: http://localhost:${PORT}/api/status
🕒 Started at: ${new Date().toISOString()}
    `);
  });

  // هندل خطاهای startup
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error('❌ Server startup error:', error);
      process.exit(1);
    }
  });
}

module.exports = app;