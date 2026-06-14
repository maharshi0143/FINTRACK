const transactionService = require('../services/transaction.service');

// Create a new transaction
async function createTransaction(req,res,next){
    try{
        const { title, amount, type, category, date, notes } = req.body;

        if(!title || !amount || !type || !category || !date){
            return res.status(400).json({
                success:false,
                message:"Title, amount, type, category and date are required"
            });
        }

        const transaction = await transactionService.createTransaction(
            req.user.id,
            title,
            amount,
            type,
            category,
            date,
            notes
        );

        res.status(201).json({
            success:true,
            message:"Transaction created successfully",
            data:transaction
        });
    } catch (error) {
        next(error);
    }
}

// Get transactions by user ID
async function getTransactions(req,res,next){
    try{
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';
        const type = req.query.type || '';
        const category = req.query.category || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder || 'DESC';
        const result = await transactionService.getTransactions(req.user.id, limit, page, search, type, category, startDate, endDate, sortBy, sortOrder);
        res.status(200).json({
            success:true,
            message:"Transactions retrieved successfully",
            data:result
        });
    }catch(error){
        next(error);
    }
}


// Get transaction by ID
async function getTransactionById(req,res,next){
    try{
        const transaction = await transactionService.getTransactionById(req.params.id, req.user.id);
        res.status(200).json({
            success:true,
            message:"Transaction retrieved successfully",
            data:transaction
        });
    } catch (error) {
        next(error);    
    }
}

// Update transaction
async function updateTransaction(req,res,next){
    try{
        const { title, amount, type, category, date, notes } = req.body;

        if(!title || !amount || !type || !category || !date){
            return res.status(400).json({
                success:false,
                message:"Title, amount, type, category and date are required"
            });
        }

        const transaction = await transactionService.updateTransaction(req.params.id, req.user.id, title, amount, type, category, date, notes);
        res.status(200).json({
            success:true,
            message:"Transaction updated successfully",
            data:transaction
        });
    }catch(error){
        next(error);
    }
}

// Delete transaction
async function deleteTransaction(req,res,next){
    try{
        const transaction = await transactionService.deleteTransaction(req.params.id, req.user.id);
        res.status(200).json({
            success:true,
            message:"Transaction deleted successfully",
            data:transaction
        });
    }catch(error){
        next(error);
    }
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};


