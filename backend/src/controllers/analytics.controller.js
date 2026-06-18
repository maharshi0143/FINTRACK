const analyticsService = require('../services/analytics.service');

// Get analytics summary
async function getSummary(req,res, next){
    try{
        const summary = await analyticsService.getSummary(req.user.id);

        res.status(200).json({
            success: true,
            data: summary
        });
    }catch(error){
        next(error);
    }
}

// Get monthly analytics summary
async function getMonthlyAnalytics(req,res,next){
    try{
        const data = await analyticsService.getMonthlyAnalytics(req.user.id);

        res.status(200).json({
            success: true,
            data: data
        });
    }catch(error){
        next(error);
    }
}

// Get category analytics summary
async function getCategoryAnalytics(req,res,next){
    try{
        const data = await analyticsService.getCategoryAnalytics(req.user.id);

        res.status(200).json({
            success: true,
            data: data
        });
    }catch(error){
        next(error);
    }
}

// Get top-expenses summary
async function getTopExpenses(req,res,next){
    try{
        const data = await analyticsService.getTopExpenses(req.user.id);

        res.status(200).json({
            success: true,
            data: data
        }); 
    }catch(error){
        next(error);
    }
}

// Get all dashboard data in one call
async function getDashboardData(req, res, next) {
    try {
        const data = await analyticsService.getDashboardData(req.user.id);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getSummary,
    getMonthlyAnalytics,
    getCategoryAnalytics,
    getTopExpenses,
    getDashboardData,
};
