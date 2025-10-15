const prisma = require("../config/db");
const logger = require("../utils/logger");

const getAll = async (req, res) => {
  try {
    const {
      q,
      category,
      brand,
      brands,
      minPrice,
      maxPrice,
      minPriceCustom,
      maxPriceCustom,
      onSale,
      featured,
      available,
      color,
      size,
      page = 1,
      limit = 20,
      sort = "createdAt:desc",
    } = req.query;

    const where = { isActive: true };

    // فیلتر برند
    if (brands) {
      const brandList = Array.isArray(brands) ? brands : brands.split(",");
      where.brand = { in: brandList.filter(Boolean) };
    } else if (brand) {
      where.brand = brand;
    }

    // فیلتر قیمت
    const actualMinPrice = minPrice || minPriceCustom;
    const actualMaxPrice = maxPrice || maxPriceCustom;

    if (actualMinPrice || actualMaxPrice) {
      where.price = {};
      if (actualMinPrice) where.price.gte = parseFloat(actualMinPrice);
      if (actualMaxPrice) where.price.lte = parseFloat(actualMaxPrice);
    }

    if (category) where.categoryId = category;
    if (onSale === "true") where.discountPercent = { gt: 0 };
    if (featured === "true") where.isFeatured = true;
    if (available === "true") where.stock = { gt: 0 };

    if (color) {
      where.colors = {
        some: { color: { contains: color, mode: "insensitive" } },
      };
    }

    if (size) {
      where.sizes = {
        some: { size: { equals: size, mode: "insensitive" } },
      };
    }

    // جستجوی متنی
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ];
    }

    // مرتب‌سازی
    const [sortField, sortDirRaw] = sort.split(":");
    const sortDir = sortDirRaw === "asc" ? "asc" : "desc";

    const orderBy = (() => {
      switch (sortField) {
        case "price":
          return { price: sortDir };
        case "salesCount":
        case "popular":
          return { salesCount: sortDir };
        case "name":
          return { name: sortDir };
        default:
          return { createdAt: sortDir };
      }
    })();

    // دریافت داده
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          sizes: true,
          colors: true,
          category: true,
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.product.count({ where })
    ]);

    // محاسبه میانگین امتیاز - با بررسی array خالی
    const productIds = items.map(item => item.id);
    const avgRatingMap = {};

    if (productIds.length > 0) {
      const avgRatings = await prisma.review.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true }
      });

      avgRatings.forEach(r => {
        avgRatingMap[r.productId] = r._avg.rating || 0;
      });
    }

    // محاسبه تخفیف
    const productsWithDiscount = items.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
      avgRating: avgRatingMap[product.id] || 0,
    }));

    const response = {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      items: productsWithDiscount,
    };

    logger.info("Products retrieved successfully", {
      count: items.length,
      total,
      filters: Object.keys(req.query).length,
    });

    return res.json(response);
  } catch (err) {
    logger.error("Get products failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve products" });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sizes: {
          orderBy: {
            size: "asc",
          },
        },
        colors: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      logger.warn("Product not found", { productId: id });
      return res.status(404).json({ message: "Product not found" });
    }

    // محاسبه میانگین رتبه
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
          product.reviews.length
        : 0;

    // قیمت نهایی با تخفیف
    const finalPrice = product.price * (1 - product.discountPercent / 100);

    const response = {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      finalPrice,
      hasDiscount: product.discountPercent > 0,
    };

    logger.info("Product details retrieved", { productId: id });
    res.json(response);
  } catch (err) {
    logger.error("Get product by ID failed", {
      error: err.message,
      productId: req.params.id,
    });
    res.status(500).json({ message: "Failed to retrieve product details" });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        sizes: true,
        colors: true,
        category: true,
        reviews: { select: { rating: true }, take: 5 }
      },
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    // اضافه کردن قیمت با تخفیف
    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    res.json(productsWithDiscount);
  } catch (err) {
    logger.error("Get featured products failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve featured products" });
  }
};

const getBestSellers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        salesCount: { gt: 0 },
      },
      include: {
        sizes: true,
        colors: true,
        category: true,
        reviews: { select: { rating: true }, take: 5 }
      },
      orderBy: { salesCount: "desc" },
      take: Number(limit),
    });

    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    res.json(productsWithDiscount);
  } catch (err) {
    logger.error("Get best sellers failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve best sellers" });
  }
};

// توابع ساده شده برای routes دیگر
const getAvailableProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        stock: { gt: 0 }
      },
      include: {
        sizes: true,
        colors: true,
        category: true
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    const total = await prisma.product.count({ 
      where: { 
        isActive: true,
        stock: { gt: 0 }
      }
    });

    res.json({
      products: productsWithDiscount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error("Get available products failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve available products" });
  }
};

const getOnSaleProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        discountPercent: { gt: 0 }
      },
      include: {
        sizes: true,
        colors: true,
        category: true
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { discountPercent: 'desc' }
    });

    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    const total = await prisma.product.count({ 
      where: { 
        isActive: true,
        discountPercent: { gt: 0 }
      }
    });

    res.json({
      products: productsWithDiscount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error("Get on-sale products failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve on-sale products" });
  }
};

const getAvailableColors = async (req, res) => {
  try {
    const colors = await prisma.productColor.findMany({
      distinct: ['color', 'colorCode'],
      select: {
        color: true,
        colorCode: true
      },
      where: {
        product: { isActive: true }
      }
    });

    res.json(colors);
  } catch (err) {
    logger.error("Get available colors failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve colors" });
  }
};

const getAvailableSizes = async (req, res) => {
  try {
    const sizes = await prisma.productSize.findMany({
      distinct: ['size'],
      select: {
        size: true
      },
      where: {
        product: { isActive: true }
      },
      orderBy: { size: 'asc' }
    });

    const sizeList = sizes.map(s => s.size);
    res.json(sizeList);
  } catch (err) {
    logger.error("Get available sizes failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve sizes" });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await prisma.product.findMany({
      where: { 
        brand: { not: null },
        isActive: true 
      },
      distinct: ['brand'],
      select: { brand: true }
    });

    const brandList = brands.map(b => b.brand).filter(Boolean);
    res.json(brandList);
  } catch (err) {
    logger.error("Get brands failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve brands" });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { productId, categoryId, limit = 4 } = req.query;

    const where = { 
      isActive: true,
      id: { not: productId }
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        sizes: true,
        colors: true,
        category: true
      },
      take: Number(limit),
      orderBy: { salesCount: 'desc' }
    });

    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    res.json(productsWithDiscount);
  } catch (err) {
    logger.error("Get related products failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve related products" });
  }
};

const getProductStats = async (req, res) => {
  try {
    const stats = await prisma.product.aggregate({
      where: { isActive: true },
      _count: { id: true },
      _avg: { price: true, discountPercent: true },
      _sum: { stock: true, salesCount: true }
    });

    const featuredCount = await prisma.product.count({
      where: { isActive: true, isFeatured: true }
    });

    const onSaleCount = await prisma.product.count({
      where: { isActive: true, discountPercent: { gt: 0 } }
    });

    res.json({
      total: stats._count.id,
      averagePrice: stats._avg.price,
      averageDiscount: stats._avg.discountPercent,
      totalStock: stats._sum.stock,
      totalSales: stats._sum.salesCount,
      featuredCount,
      onSaleCount
    });
  } catch (err) {
    logger.error("Get product stats failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve product stats" });
  }
};

const getProductsWithAdvancedFilters = async (req, res) => {
  try {
    // استفاده از تابع getAll موجود
    return getAll(req, res);
  } catch (err) {
    logger.error("Advanced search failed", { error: err.message });
    res.status(500).json({ message: "Advanced search failed" });
  }
};

const getProductsByCategoryName = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const category = await prisma.category.findFirst({
      where: { 
        name: { 
          contains: categoryName, 
          mode: 'insensitive' 
        } 
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const products = await prisma.product.findMany({
      where: { 
        categoryId: category.id,
        isActive: true 
      },
      include: {
        sizes: true,
        colors: true,
        category: true
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    const total = await prisma.product.count({ 
      where: { 
        categoryId: category.id,
        isActive: true 
      }
    });

    res.json({
      category,
      products: productsWithDiscount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error("Get products by category failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve category products" });
  }
};

const getProductsByBrand = async (req, res) => {
  try {
    const { brandName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const products = await prisma.product.findMany({
      where: { 
        brand: { 
          contains: brandName, 
          mode: 'insensitive' 
        },
        isActive: true 
      },
      include: {
        sizes: true,
        colors: true,
        category: true
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const productsWithDiscount = products.map((product) => ({
      ...product,
      finalPrice: product.price * (1 - product.discountPercent / 100),
      hasDiscount: product.discountPercent > 0,
    }));

    const total = await prisma.product.count({ 
      where: { 
        brand: { 
          contains: brandName, 
          mode: 'insensitive' 
        },
        isActive: true 
      }
    });

    res.json({
      brand: brandName,
      products: productsWithDiscount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    logger.error("Get products by brand failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve brand products" });
  }
};

// توابع ادمین
const createProduct = async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
      include: {
        sizes: true,
        colors: true,
        category: true
      }
    });

    logger.info("Product created successfully", { productId: product.id });
    res.status(201).json(product);
  } catch (err) {
    logger.error("Create product failed", { error: err.message });
    res.status(500).json({ message: "Failed to create product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
      include: {
        sizes: true,
        colors: true,
        category: true
      }
    });

    logger.info("Product updated successfully", { productId: id });
    res.json(product);
  } catch (err) {
    logger.error("Update product failed", { error: err.message, productId: req.params.id });
    res.status(500).json({ message: "Failed to update product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    logger.info("Product deleted successfully", { productId: id });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    logger.error("Delete product failed", { error: err.message, productId: req.params.id });
    res.status(500).json({ message: "Failed to delete product" });
  }
};

const addProductSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, stock } = req.body;

    const productSize = await prisma.productSize.create({
      data: {
        productId: id,
        size,
        stock
      }
    });

    logger.info("Product size added successfully", { productId: id, size });
    res.status(201).json(productSize);
  } catch (err) {
    logger.error("Add product size failed", { error: err.message, productId: req.params.id });
    res.status(500).json({ message: "Failed to add product size" });
  }
};

const addProductColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { color, colorCode, imageUrl } = req.body;

    const productColor = await prisma.productColor.create({
      data: {
        productId: id,
        color,
        colorCode,
        imageUrl
      }
    });

    logger.info("Product color added successfully", { productId: id, color });
    res.status(201).json(productColor);
  } catch (err) {
    logger.error("Add product color failed", { error: err.message, productId: req.params.id });
    res.status(500).json({ message: "Failed to add product color" });
  }
};

module.exports = {
  getAll,
  getById,
  getFeaturedProducts,
  getBestSellers,
  getAvailableProducts,
  getOnSaleProducts,
  getAvailableColors,
  getAvailableSizes,
  getBrands,
  getRelatedProducts,
  getProductStats,
  getProductsWithAdvancedFilters,
  getProductsByCategoryName,
  getProductsByBrand,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductSize,
  addProductColor
};