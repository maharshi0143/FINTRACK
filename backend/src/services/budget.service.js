const AppError = require('../utils/AppError');
const budgetRepository = require('../repositories/budget.repository');
const { getIO } = require("../socket/socket");
// Create a budget
async function createBudget(
    user_id,
    category,
    monthly_limit
) {

    const budget =
        await budgetRepository.createBudget(
            user_id,
            category,
            monthly_limit
        );

    getIO()
        .to(user_id)
        .emit(
            'budgetCreated',
            budget
        );

    return budget;
}


// Get all budgets
async function getBudgets(user_id){
   const budgets = await budgetRepository.getBudgets(user_id); 
   return budgets;
}

// Update budget by ID
async function updateBudget(id, user_id, category, monthly_limit){
    const budget = await budgetRepository.updateBudget(id, user_id, category, monthly_limit);
    if(!budget){
        throw new AppError("Budget not found or you don't have permission to update it", 404);
    }
    getIO()
    .to(user_id)
    .emit(
        'budgetUpdated',
        budget
    );
    return budget;
}

//Delete budget by ID
async function deleteBudget(id, user_id){
    const budget = await budgetRepository.deleteBudget(id, user_id);
    if(!budget){
        throw new AppError("Budget not found or you don't have permission to delete it", 404);
    }
    getIO()
    .to(user_id)
    .emit(
        'budgetDeleted',
        {
            id
        }
    );
    return budget;
}

// Get budget progress
async function getBudgetProgress(userId) {

    const budgets =
        await budgetRepository.getBudgetProgress(
            userId
        );

    return budgets.map(
        budget => {

            const monthlyLimit =
                Number(budget.monthly_limit);

            const spent =
                Number(budget.spent);

            const remaining =
                monthlyLimit - spent;

            const percentageUsed =
                monthlyLimit === 0
                    ? 0
                    : Number(
                          (
                              (spent / monthlyLimit) * 100
                          ).toFixed(2)
                      );

            return {
                id: budget.id,
                category: budget.category,
                monthly_limit: monthlyLimit,
                spent,
                remaining,
                percentageUsed
            };

        }
    );

}

module.exports = {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    getBudgetProgress
};
