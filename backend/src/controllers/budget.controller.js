const budgetService = require('../services/budget.service');

// Create a new budget
async function createBudget(req,res,next){
    try{
        const { category, monthly_limit } = req.body;

        if(!category || monthly_limit === undefined || monthly_limit === null){
            return res.status(400).json({
                success: false,
                message: "Category and monthly limit are required"
            });
        }

        const budget = await budgetService.createBudget(
            req.user.id,
            category,
            monthly_limit
        );

        res.status(201).json({
            success: true,
            message: "Budget created successfully",
            data: budget
        });
    }catch(error){
        next(error);
    }
}

// Get all budgets
async function getBudgets(req,res,next){
    try{
        const budgets = await budgetService.getBudgets(req.user.id);

        res.status(200).json({
            success: true,
            data: budgets
        });
    }catch(error){
        next(error);
    }
}

// Update a budget by ID
async function updateBudget(
    req,
    res,
    next
) {

    try {
        const {
            category,
            monthly_limit
        } = req.body;

        const budget =
            await budgetService.updateBudget(
                req.params.id,
                req.user.id,
                category,
                monthly_limit
            );

        res.status(200).json({
            success: true,
            message:
                'Budget updated successfully',
            data: budget
        });

    } catch (error) {
        next(error);
    }
}

// Delete a budget by ID
async function deleteBudget(req, res, next) {
    try{
        const budget = await budgetService.deleteBudget(req.params.id, req.user.id);

        res.status(200).json({
            success: true,
            message: "Budget deleted successfully",
            data: budget
        });
    } catch (error) {
        next(error);
    }
}

// Get budget progress
async function getBudgetProgress(req,res,next){
    try{
        const progress = await budgetService.getBudgetProgress(req.user.id);

        res.status(200).json({
            success: true,
            data: progress
        }); 
    }catch(error){
        next(error);
    }
}

module.exports = {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    getBudgetProgress
};
