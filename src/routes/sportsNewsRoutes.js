// routes/sportsNewsRoutes.js
const express = require('express');
const router = express.Router();
const sportsNewsController = require('../controllers/sportsNewsController');

// Routes عمومی
router.get('/', sportsNewsController.getAllSportsNews);
router.get('/latest', sportsNewsController.getLatestSportsNews);
router.get('/popular', sportsNewsController.getPopularSportsNews);
router.get('/:id', sportsNewsController.getSportsNewsById);


module.exports = router;