const AppError = require('../utils/AppError');
const transactionRepository = require('../repositories/transaction.repository');

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
    const transaction = await transactionRepository.createTransaction(
        userId,
        title,
        amount,
        type,
        category,
        date,
        notes
    );
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
    return transaction;
}

// Delete transaction
async function deleteTransaction(transactionId, userId){
    const transaction = await transactionRepository.deleteTransaction(transactionId, userId);

    if(!transaction){
        throw new AppError("Transaction not found", 404);
    }
    return transaction;
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};