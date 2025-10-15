const express = require('express');
const prisma = require('../config/db');

const router = express.Router();

// تابع کمکی برای بررسی سلامت دیتابیس
const checkDatabase = async () => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: بررسی سلامت سیستم - System Health Checks
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive Health Check
 *     description: بررسی کامل سلامت سیستم و سرویس‌ها - Comprehensive system health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: سیستم سالم است - System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                   description: وضعیت کلی سیستم - Overall system status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: زمان بررسی - Check timestamp
 *                 services:
 *                   type: object
 *                   description: وضعیت سرویس‌ها - Services status
 *                   properties:
 *                     database:
 *                       type: object
 *                       description: وضعیت پایگاه داده - Database status
 *                 uptime:
 *                   type: number
 *                   description: زمان فعالیت (ثانیه) - Uptime in seconds
 *                 memory:
 *                   type: object
 *                   description: مصرف حافظه - Memory usage
 *                 version:
 *                   type: string
 *                   description: نسخه سیستم - System version
 *       503:
 *         description: سیستم ناسالم است - Service unhealthy
 */
router.get('/', async (req, res) => {
  try {
    const dbHealth = await checkDatabase();

    const services = {
      database: dbHealth
    };

    // تعیین وضعیت کلی
    const isHealthy = dbHealth.status === 'healthy';

    const memoryUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    const healthResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
      system: {
        uptime: Math.round(process.uptime()),
        memory: memoryMB,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      version: process.env.npm_package_version || '2.2.0'
    };

    res.status(isHealthy ? 200 : 503).json(healthResponse);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Readiness Probe
 *     description: بررسی آمادگی سیستم - Readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: سیستم آماده است - Service is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: سیستم آماده نیست - Service is not ready
 */
router.get('/readiness', async (req, res) => {
  try {
    // بررسی سرویس حیاتی
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Liveness Probe
 *     description: بررسی حیات سیستم - Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: سیستم زنده است - Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: زمان فعالیت (ثانیه) - Uptime in seconds
 */
router.get('/liveness', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

module.exports = router;