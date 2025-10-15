// src/controllers/returnController.js
const prisma = require("../config/db");
const logger = require("../utils/logger");

const createReturnRequest = async (req, res) => {
  try {
    const { orderId, reason, items } = req.body;
    const userId = req.user.id;

    // بررسی وجود سفارش
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: {
          include: { product: true }
        }
      }
    });
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: 'سفارش یافت نشد یا متعلق به شما نیست' });
    }

    // بررسی وضعیت سفارش (فقط سفارشات تحویل شده قابل بازگشت هستند)
    if (!['COMPLETED', 'SHIPPED'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'فقط سفارشات تحویل شده قابل بازگشت هستند' 
      });
    }

    // بررسی وجود درخواست بازگشت فعال
    const existingReturn = await prisma.returnRequest.findFirst({
      where: { 
        orderId, 
        status: { 
          in: ['PENDING', 'APPROVED'] 
        } 
      }
    });
    
    if (existingReturn) {
      return res.status(400).json({ 
        message: 'برای این سفارش قبلاً درخواست بازگشت ثبت شده است' 
      });
    }

    // اعتبارسنجی آیتم‌های بازگشت
    for (const item of items) {
      const orderItem = order.items.find(i => i.id === item.orderItemId);
      if (!orderItem) {
        return res.status(400).json({ 
          message: `آیتم سفارش با شناسه ${item.orderItemId} یافت نشد` 
        });
      }
      
      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({ 
          message: `تعداد درخواستی برای بازگشت بیشتر از تعداد خریداری شده است` 
        });
      }
    }

    // ایجاد درخواست بازگشت
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        userId,
        reason,
        status: 'PENDING',
        returnItems: {
          create: items.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            returnReason: item.returnReason
          }))
        }
      },
      include: {
        order: {
          include: { 
            items: {
              include: { product: true }
            }
          }
        },
        returnItems: {
          include: {
            orderItem: {
              include: { product: true }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info('Return request created successfully', { 
      returnId: returnRequest.id, 
      userId,
      orderId 
    });

    res.status(201).json(returnRequest);
  } catch (err) {
    logger.error('Create return request failed', { error: err.message });
    res.status(500).json({ message: 'خطا در ایجاد درخواست بازگشت' });
  }
};

const getUserReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: {
          order: {
            include: { 
              user: { 
                select: { 
                  firstName: true, 
                  lastName: true 
                } 
              } 
            }
          },
          returnItems: {
            include: {
              orderItem: {
                include: { product: true }
              }
            }
          }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.returnRequest.count({ where })
    ]);

    res.json({
      returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Get user returns failed', { error: err.message });
    res.status(500).json({ message: 'خطا در دریافت درخواست‌های بازگشت' });
  }
};

const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: { 
            items: {
              include: { product: true }
            },
            user: { 
              select: { 
                firstName: true, 
                lastName: true 
              } 
            } 
          }
        },
        returnItems: {
          include: {
            orderItem: {
              include: { product: true }
            }
          }
        },
        user: { 
          select: { 
            firstName: true, 
            lastName: true, 
            email: true 
          } 
        }
      }
    });

    if (!returnRequest) {
      return res.status(404).json({ message: 'درخواست بازگشت یافت نشد' });
    }

    // بررسی دسترسی (کاربر خودش یا ادمین)
    if (returnRequest.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    res.json(returnRequest);
  } catch (err) {
    logger.error('Get return by id failed', { error: err.message });
    res.status(500).json({ message: 'خطا در دریافت اطلاعات بازگشت' });
  }
};

const getAllReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, userId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: {
          order: {
            include: { 
              user: { 
                select: { 
                  firstName: true, 
                  lastName: true 
                } 
              } 
            }
          },
          returnItems: {
            include: {
              orderItem: {
                include: { product: true }
              }
            }
          },
          user: { 
            select: { 
              firstName: true, 
              lastName: true, 
              email: true 
            } 
          }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.returnRequest.count({ where })
    ]);

    res.json({
      returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Get all returns failed', { error: err.message });
    res.status(500).json({ message: 'خطا در دریافت لیست بازگشت‌ها' });
  }
};

const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, refundAmount } = req.body;

    const returnRequest = await prisma.returnRequest.findUnique({ 
      where: { id },
      include: { order: true }
    });
    
    if (!returnRequest) {
      return res.status(404).json({ message: 'درخواست بازگشت یافت نشد' });
    }

    const updatedReturn = await prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        refundAmount: refundAmount || null,
        updatedAt: new Date()
      },
      include: {
        order: {
          include: { 
            items: {
              include: { product: true }
            }
          }
        },
        returnItems: {
          include: {
            orderItem: {
              include: { product: true }
            }
          }
        },
        user: { 
          select: { 
            firstName: true, 
            lastName: true, 
            email: true 
          } 
        }
      }
    });

    // اگر وضعیت REFUNDED شد، می‌توانید پرداخت بازگشتی را انجام دهید
    if (status === 'REFUNDED') {
      logger.info('Refund processed for return', { 
        returnId: id, 
        orderId: returnRequest.orderId,
        refundAmount 
      });
    }

    logger.info('Return status updated', { 
      returnId: id, 
      newStatus: status,
      adminId: req.user.id 
    });

    res.json(updatedReturn);
  } catch (err) {
    logger.error('Update return status failed', { error: err.message });
    res.status(500).json({ message: 'خطا در بروزرسانی وضعیت بازگشت' });
  }
};

const cancelReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id }
    });

    if (!returnRequest) {
      return res.status(404).json({ message: 'درخواست بازگشت یافت نشد' });
    }

    if (returnRequest.userId !== userId) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    // فقط درخواست‌های در حالت PENDING قابل لغو هستند
    if (returnRequest.status !== 'PENDING') {
      return res.status(400).json({ 
        message: 'فقط درخواست‌های در انتظار بررسی قابل لغو هستند' 
      });
    }

    const cancelledReturn = await prisma.returnRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        order: true,
        returnItems: {
          include: {
            orderItem: {
              include: { product: true }
            }
          }
        }
      }
    });

    logger.info('Return request cancelled', { 
      returnId: id, 
      userId 
    });

    res.json(cancelledReturn);
  } catch (err) {
    logger.error('Cancel return request failed', { error: err.message });
    res.status(500).json({ message: 'خطا در لغو درخواست بازگشت' });
  }
};

module.exports = {
  createReturnRequest,
  getUserReturns,
  getReturnById,
  getAllReturns,
  updateReturnStatus,
  cancelReturnRequest
};