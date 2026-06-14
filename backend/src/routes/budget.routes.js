const express = require('express');
const budgetController = require('../controllers/budget.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a new budget
router.post('/', authMiddleware, budgetController.createBudget);

// Get all budgets
router.get('/', authMiddleware, budgetController.getBudgets);

// Update a budget by ID
router.put('/:id', authMiddleware, budgetController.updateBudget);

// Delete a budget by ID
router.delete('/:id', authMiddleware, budgetController.deleteBudget);

// Get budget progress
router.get('/progress', authMiddleware, budgetController.getBudgetProgress);

module.exports = router;