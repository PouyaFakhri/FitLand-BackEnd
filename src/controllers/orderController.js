// src/controllers/orderController.js - نسخه بهبود یافته با timeout
const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// تابع کمکی برای تولید کد سفارش
const generateOrderCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// تابع کمکی برای بررسی موجودی
const checkStockWithLocking = async (tx, items) => {
  const stockChecks = [];
  const orderItems = [];
  let total = 0;

  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: { sizes: true, colors: true }
    });

    if (!product || !product.isActive) {
      throw new Error(`Product ${item.productId} not found or inactive`);
    }

    // بررسی موجودی کلی
    if (product.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
      );
    }

    // بررسی موجودی سایز خاص
    if (item.size && item.size !== 'ONE_SIZE') {
      const productSize = product.sizes.find(s => s.size === item.size);
      if (!productSize) {
        throw new Error(`Invalid size ${item.size} for ${product.name}`);
      }
      if (productSize.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for size ${item.size} of ${product.name}. Available: ${productSize.stock}, Requested: ${item.quantity}`
        );
      }
    }

    // محاسبه قیمت با تخفیف
    const finalPrice = parseFloat(product.price.toString()) * 
      (1 - parseFloat(product.discountPercent.toString()) / 100);
    
    total += finalPrice * item.quantity;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: finalPrice.toFixed(2),
      productName: product.name
    });
  }

  return { orderItems, total: parseFloat(total.toFixed(2)) };
};

const createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod = 'ONLINE' } = req.body;
    const userId = req.user.id;

    // استفاده از transaction با timeout
    const result = await prisma.$transaction(async (tx) => {
      // بررسی موجودی و محاسبه قیمت
      const { orderItems, total } = await checkStockWithLocking(tx, items);

      const orderCode = generateOrderCode();

      // ایجاد سفارش
      const order = await tx.order.create({
        data: {
          id: uuidv4(),
          userId,
          total,
          address,
          status: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
          orderCode,
          paymentMethod
        }
      });

      // ایجاد آیتم‌های سفارش
      const orderItemData = orderItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size || null,
        color: item.color || null
      }));

      await tx.orderItem.createMany({
        data: orderItemData
      });

      // آپدیت موجودی
      for (const item of orderItems) {
        // آپدیت موجودی محصول
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity }
          }
        });

        // آپدیت موجودی سایز اگر مشخص شده
        if (item.size && item.size !== 'ONE_SIZE') {
          await tx.productSize.updateMany({
            where: {
              productId: item.productId,
              size: item.size
            },
            data: {
              stock: { decrement: item.quantity }
            }
          });
        }
      }

      // پاک کردن سبد خرید
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return order;
    }, {
      maxWait: 5000,  // حداکثر 5 ثانیه انتظار برای شروع transaction
      timeout: 10000  // حداکثر 10 ثانیه برای اجرای کل transaction
    });

    // بازگشت سفارش با جزئیات
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                sizes: true,
                colors: true
              }
            }
          }
        }
      }
    });

    logger.info('Order created successfully', {
      orderId: result.id,
      userId,
      total: result.total,
      itemCount: items.length,
      paymentMethod
    });

    res.status(201).json({
      success: true,
      data: orderWithDetails,
      message: paymentMethod === 'CASH_ON_DELIVERY' 
        ? 'سفارش با پرداخت در محل ثبت شد' 
        : 'سفارش با موفقیت ایجاد شد'
    });
  } catch (err) {
    logger.error('Create order failed', { 
      error: err.message,
      userId: req.user.id 
    });
    
    if (err.message.includes('Insufficient stock')) {
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order' 
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10, sort = 'newest' } = req.query;
    
    const where = { userId: req.user.id };
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    // مرتب‌سازی
    let orderBy = { createdAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'total-high':
        orderBy = { total: 'desc' };
        break;
      case 'total-low':
        orderBy = { total: 'asc' };
        break;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  sizes: true,
                  colors: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.order.count({ where })
    ]);

    // آمار سفارشات
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { userId: req.user.id },
      _count: { id: true }
    });

    const stats = {
      all: total,
      PENDING: orderStats.find(s => s.status === 'PENDING')?._count.id || 0,
      PAID: orderStats.find(s => s.status === 'PAID')?._count.id || 0,
      SHIPPED: orderStats.find(s => s.status === 'SHIPPED')?._count.id || 0,
      COMPLETED: orderStats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      CANCELLED: orderStats.find(s => s.status === 'CANCELLED')?._count.id || 0,
      RETURNED: orderStats.find(s => s.status === 'RETURNED')?._count.id || 0
    };

    logger.info('Orders retrieved', {
      userId: req.user.id,
      status,
      count: orders.length
    });

    res.json({
      success: true,
      data: {
        orders,
        stats,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (err) {
    logger.error('Get orders failed', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve orders' 
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: req.user.id
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                sizes: true,
                colors: true,
                category: true,
                reviews: {
                  where: { userId: req.user.id },
                  select: { id: true, rating: true, text: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    logger.info('Order details retrieved', { orderId, userId: req.user.id });
    
    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    logger.error('Get order by id failed', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve order details' 
    });
  }
};

// برای backward compatibility
const createCashOnDeliveryOrder = async (req, res) => {
  req.body.paymentMethod = 'CASH_ON_DELIVERY';
  return createOrder(req, res);
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  createCashOnDeliveryOrder
};