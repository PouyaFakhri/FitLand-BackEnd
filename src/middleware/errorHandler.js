const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // لاگ خطا
  logger.error('Error occurred:', {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // خطاهای Prisma
  if (err.code === 'P2025') {
    error.message = 'Record not found';
    error.statusCode = 404;
  } else if (err.code?.startsWith('P')) {
    error.message = 'Database operation failed';
    error.statusCode = 400;
  }

  // خطاهای JWT
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};

// تابع کمکی برای هندل کردن async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// middleware برای هندل کردن 404
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Endpoint not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  catchAsync,
  notFoundHandler
};