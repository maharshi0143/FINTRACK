const analyticsRepository = require('../repositories/analytics.repository');

// Get analytics summary
async function getSummary(userId){
    const result = await analyticsRepository.getSummary(userId);

    const income = Number(result.total_income);

    const expense = Number(result.total_expense);

    return {
        income,
        expense,
        balance: income - expense
    };
}


// Get monthly analytics summary
async function getMonthlyAnalytics(userId) {

    const result =
        await analyticsRepository.getMonthlyAnalytics(
            userId
        );

    return result.map(
        month => ({
            month: month.month
                .toISOString()
                .slice(0, 7),

            income:
                Number(month.income),

            expense:
                Number(month.expense)
        })
    );

}


// Get category analytics summary
async function getCategoryAnalytics(userId) {
    const result = await analyticsRepository.getCategoryAnalytics(userId);

    return result.map(
        item => ({
            category: item.category,
            total: Number(item.total)
        })
    );
}

// Get top-expenses summary
async function getTopExpenses(userId){
    const result = await analyticsRepository.getTopExpenses(userId);

    return result.map(
        item => ({
            title: item.title,
            amount: Number(item.amount),
            category: item.category,
            date: item.date,
        })
    );
}

async function getDashboardData(userId) {
    const [summary, monthly, category, topExpenses] = await Promise.all([
        getSummary(userId),
        getMonthlyAnalytics(userId),
        getCategoryAnalytics(userId),
        getTopExpenses(userId),
    ]);

    return { summary, monthly, category, topExpenses };
}

module.exports = {
    getSummary,
    getMonthlyAnalytics,
    getCategoryAnalytics,
    getTopExpenses,
    getDashboardData,
};