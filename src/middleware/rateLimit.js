const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Memory store for rate limiting
const createMemoryStore = () => {
  const store = new Map();
  
  return {
    incr: (key, callback) => {
      const current = store.get(key) || 0;
      const newValue = current + 1;
      store.set(key, newValue);
      callback(null, newValue);
    },
    decrement: (key) => {
      const current = store.get(key) || 0;
      if (current > 0) {
        store.set(key, current - 1);
      }
    },
    resetKey: (key) => {
      store.delete(key);
    }
  };
};

// عمومی - برای همه کاربران
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    return req.user ? 500 : 100;
  },
  keyGenerator: (req) => {
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      }
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createMemoryStore()
});

// احراز هویت - محدودیت بیشتر
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  keyGenerator: (req) => `auth:${req.ip}`,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', { ip: req.ip });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT',
        message: 'Too many authentication attempts, please try again in 15 minutes.',
        retryAfter: 900
      }
    });
  },
  skipSuccessfulRequests: true
});

// جستجو - محدودیت متوسط
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => {
    return req.user ? `search:user:${req.user.id}` : `search:ip:${req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'SEARCH_RATE_LIMIT',
        message: 'Too many search requests, please slow down.'
      }
    });
  }
});

// API شدید - برای endpointهای حساس
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => `strict:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'STRICT_RATE_LIMIT',
        message: 'Too many requests to this endpoint.'
      }
    });
  }
});

// Admin - محدودیت کمتر برای ادمین‌ها
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => req.user?.role === 'ADMIN' ? 1000 : 100,
  keyGenerator: (req) => `admin:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'ADMIN_RATE_LIMIT',
        message: 'Rate limit exceeded for admin operations.'
      }
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  searchLimiter,
  strictLimiter,
  adminLimiter
};