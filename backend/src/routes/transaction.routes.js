const express = require('express');

const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a new transaction
router.post('/', authMiddleware, transactionController.createTransaction);

// Get transactions by user ID
router.get('/', authMiddleware, transactionController.getTransactions);

// Get transaction by ID
router.get('/:id', authMiddleware, transactionController.getTransactionById);

// Update transaction
router.put('/:id', authMiddleware, transactionController.updateTransaction);

// Delete transaction
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

module.exports = router;

