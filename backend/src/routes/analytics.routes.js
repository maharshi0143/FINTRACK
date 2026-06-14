const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Get analytics summary
router.get('/summary', authMiddleware, analyticsController.getSummary);

// Get monthly analytics summary
router.get('/monthly', authMiddleware, analyticsController.getMonthlyAnalytics);

// Get category analytics summary
router.get('/category', authMiddleware, analyticsController.getCategoryAnalytics);

// Get top-expenses summary
router.get('/top-expenses', authMiddleware, analyticsController.getTopExpenses);

module.exports = router;