const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
const getCart = async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({ 
      where: { userId: req.user.id }, 
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
      } 
    });
    
    if (!cart) {
      // اگر سبد خرید وجود نداشت، ایجادش کن
      cart = await prisma.cart.create({
        data: {
          userId: req.user.id
        },
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
        }
      });
    }
    
    // محاسبه قیمت نهایی برای هر محصول
    const cartWithFinalPrices = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          finalPrice: item.product.price * (1 - (item.product.discountPercent || 0) / 100),
          hasDiscount: (item.product.discountPercent || 0) > 0
        }
      }))
    };

    res.json(cartWithFinalPrices);
  } catch (err) {
    logger.error('Get cart failed', { error: err.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to retrieve cart' });
  }
};

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Invalid product or insufficient stock
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    
    // اعتبارسنجی quantity
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // بررسی وجود محصول و فعال بودن آن
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        sizes: true, 
        colors: true 
      }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ message: 'Product is not available' });
    }

    // بررسی موجودی کلی محصول
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stock} items available` 
      });
    }
    
    // بررسی معتبر بودن سایز
    if (size && size !== 'ONE_SIZE') {
      const productSize = product.sizes.find(s => s.size === size);
      if (!productSize) {
        return res.status(400).json({ 
          message: `Size ${size} is not available for this product` 
        });
      }
      if (productSize.stock < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for size ${size}. Only ${productSize.stock} available` 
        });
      }
    }
    
    // بررسی معتبر بودن رنگ
    if (color) {
      const productColor = product.colors.find(c => c.color === color);
      if (!productColor) {
        return res.status(400).json({ 
          message: `Color ${color} is not available for this product` 
        });
      }
      // توجه: موجودی رنگ‌ها در سطح محصول مدیریت می‌شود
      // اگر نیاز به مدیریت جداگانه موجودی رنگ‌ها دارید، باید schema آپدیت شود
    } else if (product.colors && product.colors.length > 0) {
      // اگر محصول رنگ‌های مختلف دارد اما رنگ انتخاب نشده
      return res.status(400).json({ 
        message: 'Color selection is required for this product' 
      });
    }
    
    // پیدا کردن یا ایجاد سبد خرید
    let cart = await prisma.cart.findUnique({ 
      where: { userId: req.user.id }, 
      include: { items: true } 
    });
    
    if (!cart) {
      cart = await prisma.cart.create({ 
        data: { userId: req.user.id } 
      });
    }

    // بررسی وجود آیتم تکراری
    const existingItem = cart.items.find(item => 
      item.productId === productId && 
      item.size === (size || null) && 
      item.color === (color || null)
    );
    
    if (existingItem) {
      // بررسی موجودی برای آپدیت quantity
      const newQuantity = existingItem.quantity + quantity;
      
      // بررسی موجودی کلی
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for updated quantity. Only ${product.stock} available` 
        });
      }
      
      // بررسی موجودی سایز
      if (size && size !== 'ONE_SIZE') {
        const productSize = product.sizes.find(s => s.size === size);
        if (productSize.stock < newQuantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for size ${size} with updated quantity. Only ${productSize.stock} available` 
          });
        }
      }
      
      // آپدیت quantity آیتم موجود
      await prisma.cartItem.update({ 
        where: { id: existingItem.id }, 
        data: { quantity: newQuantity } 
      });
    } else {
      // ایجاد آیتم جدید
      await prisma.cartItem.create({ 
        data: { 
          cartId: cart.id, 
          productId, 
          quantity,
          size: size || null,
          color: color || null
        } 
      });
    }

    // بازگشت سبد خرید به‌روز شده
    const updatedCart = await prisma.cart.findUnique({ 
      where: { userId: req.user.id }, 
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
      } 
    });

    // محاسبه قیمت نهایی
    const cartWithFinalPrices = {
      ...updatedCart,
      items: updatedCart.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          finalPrice: item.product.price * (1 - (item.product.discountPercent || 0) / 100),
          hasDiscount: (item.product.discountPercent || 0) > 0
        }
      }))
    };
    
    logger.info('Item added to cart', { 
      userId: req.user.id, 
      productId, 
      quantity, 
      size, 
      color 
    });

    res.json(cartWithFinalPrices);
  } catch (err) {
    logger.error('Add to cart failed', { 
      error: err.message, 
      userId: req.user.id,
      productId: req.body.productId 
    });
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

/**
 * @swagger
 * /api/cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Cart item not found
 */
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // اعتبارسنجی quantity
    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    // بررسی وجود آیتم در سبد خرید کاربر
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
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

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartItem = cart.items.find(item => item.id === itemId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // اگر quantity صفر شد، آیتم رو حذف کن
    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      // بررسی موجودی برای quantity جدید
      const product = cartItem.product;

      // بررسی موجودی کلی
      if (product.stock < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${product.stock} items available` 
        });
      }

      // بررسی موجودی برای سایز خاص
      if (cartItem.size && cartItem.size !== 'ONE_SIZE') {
        const productSize = product.sizes.find(s => s.size === cartItem.size);
        if (productSize && productSize.stock < quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for size ${cartItem.size}. Only ${productSize.stock} available` 
          });
        }
      }

      // آپدیت quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }

    // بازگشت سبد خرید به‌روز شده
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
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
      }
    });

    // محاسبه قیمت نهایی
    const cartWithFinalPrices = {
      ...updatedCart,
      items: updatedCart.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          finalPrice: item.product.price * (1 - (item.product.discountPercent || 0) / 100),
          hasDiscount: (item.product.discountPercent || 0) > 0
        }
      }))
    };

    logger.info('Cart item updated', { 
      userId: req.user.id, 
      itemId, 
      quantity 
    });

    res.json(cartWithFinalPrices);
  } catch (err) {
    logger.error('Update cart item failed', { 
      error: err.message, 
      userId: req.user.id,
      itemId: req.params.itemId 
    });
    res.status(500).json({ message: 'Failed to update cart item' });
  }
};

/**
 * @swagger
 * /api/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Cart item not found
 */
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    // بررسی وجود آیتم در سبد خرید کاربر
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: true }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cartItem = cart.items.find(item => item.id === itemId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // حذف آیتم
    await prisma.cartItem.delete({ where: { id: itemId } });

    // بازگشت سبد خرید به‌روز شده
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
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
      }
    });

    // محاسبه قیمت نهایی
    const cartWithFinalPrices = {
      ...updatedCart,
      items: updatedCart.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          finalPrice: item.product.price * (1 - (item.product.discountPercent || 0) / 100),
          hasDiscount: (item.product.discountPercent || 0) > 0
        }
      }))
    };

    logger.info('Item removed from cart', { 
      userId: req.user.id, 
      itemId 
    });

    res.json(cartWithFinalPrices);
  } catch (err) {
    logger.error('Remove from cart failed', { 
      error: err.message, 
      userId: req.user.id,
      itemId: req.params.itemId 
    });
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
};

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
// src/controllers/cartController.js - بخش clearCart بهبود یافته
// این تابع را در فایل اصلی جایگزین کنید

const clearCart = async (req, res) => {
  try {
    // پاک کردن به صورت atomic بدون نیاز به پیدا کردن cart
    await prisma.cartItem.deleteMany({
      where: { 
        cart: {
          userId: req.user.id
        }
      }
    });

    logger.info('Cart cleared', { userId: req.user.id });

    res.json({ 
      message: 'Cart cleared successfully', 
      items: [] 
    });
  } catch (err) {
    logger.error('Clear cart failed', { 
      error: err.message, 
      userId: req.user.id 
    });
    res.status(500).json({ message: 'Failed to clear cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};