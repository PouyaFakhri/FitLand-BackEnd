// controllers/sportsNewsController.js
const prisma = require("../config/db");
const logger = require("../utils/logger");

const getAllSportsNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search } }
      ];
    }

    const [news, total] = await Promise.all([
      prisma.sportsNews.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.sportsNews.count({ where })
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      items: news,
    });
  } catch (err) {
    logger.error("Get sports news failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve sports news" });
  }
};

const getSportsNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await prisma.sportsNews.findUnique({
      where: { id },
    });

    if (!news) {
      return res.status(404).json({ message: "Sports news not found" });
    }

    // افزایش تعداد بازدید
    await prisma.sportsNews.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json(news);
  } catch (err) {
    logger.error("Get sports news by ID failed", {
      error: err.message,
      newsId: req.params.id,
    });
    res.status(500).json({ message: "Failed to retrieve sports news" });
  }
};

const getLatestSportsNews = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const news = await prisma.sportsNews.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });

    res.json(news);
  } catch (err) {
    logger.error("Get latest sports news failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve latest sports news" });
  }
};

const getPopularSportsNews = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const news = await prisma.sportsNews.findMany({
      where: { isActive: true },
      orderBy: { viewCount: "desc" },
      take: Number(limit),
    });

    res.json(news);
  } catch (err) {
    logger.error("Get popular sports news failed", { error: err.message });
    res.status(500).json({ message: "Failed to retrieve popular sports news" });
  }
};

// توابع ادمین
const createSportsNews = async (req, res) => {
  try {
    const news = await prisma.sportsNews.create({
      data: req.body,
    });

    logger.info("Sports news created successfully", { newsId: news.id });
    res.status(201).json(news);
  } catch (err) {
    logger.error("Create sports news failed", { error: err.message });
    res.status(500).json({ message: "Failed to create sports news" });
  }
};

const updateSportsNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await prisma.sportsNews.update({
      where: { id },
      data: req.body,
    });

    logger.info("Sports news updated successfully", { newsId: id });
    res.json(news);
  } catch (err) {
    logger.error("Update sports news failed", { 
      error: err.message, 
      newsId: req.params.id 
    });
    res.status(500).json({ message: "Failed to update sports news" });
  }
};

const deleteSportsNews = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.sportsNews.delete({
      where: { id }
    });

    logger.info("Sports news deleted successfully", { newsId: id });
    res.json({ message: "Sports news deleted successfully" });
  } catch (err) {
    logger.error("Delete sports news failed", { 
      error: err.message, 
      newsId: req.params.id 
    });
    res.status(500).json({ message: "Failed to delete sports news" });
  }
};

module.exports = {
  getAllSportsNews,
  getSportsNewsById,
  getLatestSportsNews,
  getPopularSportsNews,
  createSportsNews,
  updateSportsNews,
  deleteSportsNews
};