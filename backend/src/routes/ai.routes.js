const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');

const aiController = require('../controllers/ai.controller');


const router = express.Router();

// Generate AI Insights
router.post('/insights',authMiddleware,aiController.generateInsights);

// Generate Monthly Summary
router.get('/monthly-summary',authMiddleware,aiController.generateMonthlySummary);

// Generate saving suggestions
router.get('/savings-suggestions',authMiddleware,aiController.generateSavingsSuggestions);

// Chat with AI
router.post('/chat',authMiddleware,aiController.chatWithAI);

// Generate Expense Forecast
router.get('/forecast',authMiddleware,aiController.generateExpenseForecast);

// Detect Spending Anomalies
router.get('/anomalies',authMiddleware,aiController.detectSpendingAnomalies);

// Get Budget Recommendations
router.get('/budget-recommendations',authMiddleware,aiController.generateBudgetRecommendations);

// Natural Language Expense Entry
router.post('/parse-expense',authMiddleware,aiController.parseExpense);

// Monthly Report
router.get('/monthly-report',authMiddleware,aiController.monthlyReport);

module.exports = router;