const AppError = require('../utils/AppError');
const transactionRepository = require('../repositories/transaction.repository');
const budgetRepository = require('../repositories/budget.repository');
const notificationService = require('./notification.service');
const { getIO } = require("../socket/socket");

async function checkBudgetThresholds(userId, category) {
    try {
        const budgets = await budgetRepository.getBudgetProgress(userId);
        const budget = budgets.find(b => b.category === category);
        if (budget) {
            const percentage = (Number(budget.spent) / Number(budget.monthly_limit)) * 100;
            if (percentage >= 100) {
                await notificationService.createNotification(
                    userId,
                    'Budget Exceeded',
                    `Your ${category} budget of ₹${budget.monthly_limit} has been exceeded! Current spend: ₹${budget.spent}`
                );
            } else if (percentage >= 80) {
                await notificationService.createNotification(
                    userId,
                    'Budget Alert',
                    `You've used ${percentage.toFixed(0)}% of your ${category} budget (₹${budget.spent} of ₹${budget.monthly_limit})`
                );
            }
        }
    } catch (e) {
        console.error('Budget threshold check failed:', e.message);
    }
}

// Creating a transaction
async function createTransaction(
    userId,
    title,
    amount,
    type,
    category,
    date,
    notes
){
    const transaction =
        await transactionRepository.createTransaction(
            userId,
            title,
            amount,
            type,
            category,
            date,
            notes
        );

    getIO()
        .to(userId)
        .emit(
            'transactionCreated',
            transaction
        );

    if (type === 'expense') {
        checkBudgetThresholds(userId, category);
    }

    return transaction;
}

// Get transactions by limit and page
async function getTransactions(userId, limit, page, search, type, category, startDate, endDate,sortBy, sortOrder){
    const offset = (page - 1) * limit;

    const transactions = await transactionRepository.getTransactions(userId, limit, offset, search, type, category, startDate, endDate, sortBy, sortOrder);
    const total = await transactionRepository.getTransactionCount(userId, search, type);
    return { transactions, total, currentPage: page, totalPages: Math.ceil(total / limit) };
}


// Get transaction by ID
async function getTransactionById(transactionId, userId){
    const transaction = await transactionRepository.getTransactionById(transactionId, userId);

    if(!transaction){
        throw new AppError("Transaction not found", 404);
    }
    return transaction;
}

// Update transaction
async function updateTransaction(transactionId, userId, title, amount, type, category, date, notes){
    const transaction = await transactionRepository.updateTransaction(transactionId, userId, title, amount, type, category, date, notes);

    if(!transaction){
        throw new AppError("Transaction not found", 404);
    }
    getIO()
        .to(userId)
        .emit(
            'transactionUpdated',
            transaction
        );

    if (type === 'expense') {
        checkBudgetThresholds(userId, category);
    }

    return transaction;
}

// Delete transaction
async function deleteTransaction(transactionId, userId){
    const transaction = await transactionRepository.deleteTransaction(transactionId, userId);

    if(!transaction){
        throw new AppError("Transaction not found", 404);
    }
    getIO()
        .to(userId)
        .emit(
            'transactionDeleted',
            {
                id: transactionId
            }
        );
    return transaction;
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};