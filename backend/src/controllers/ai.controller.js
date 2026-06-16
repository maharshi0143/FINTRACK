const aiService = require(
    '../services/ai.service'
);

// Generate Insights
async function generateInsights(
    req,
    res,
    next
) {

    try {
        const {
            income,
            expense,
            topCategory
        } = req.body;
        if (
            income == null ||
            expense == null ||
            !topCategory
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Income, expense and topCategory are required'
            });
        }
        const insight =
            await aiService.generateInsights(
                income,
                expense,
                topCategory
            );
        res.status(200).json({
            success: true,
            data: {
                insight
            }
        });

    } catch (error) {
        next(error);
    }
}


// Generate Monthly Summary
async function generateMonthlySummary(req,res,next){
    try{
        const summary = await aiService.generateMonthlySummary(req.user.id);

        res.status(200).json({
            success: true,
            data: summary
        });
    }catch(error){
        next(error);
    }
}

// AI Generate Savings Suggestion
async function generateSavingsSuggestions(req,res,next){
    try{
        const suggestion = await aiService.generateSavingsSuggestions(req.user.id);

        res.status(200).json({
            success: true,
            data: suggestion
        });
    }catch(error){
        next(error);
    }
}

// Chat with AI
async function chatWithAI(
    req,
    res,
    next
) {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Question is required'
            });
        }

        const answer =
            await aiService.chatWithAI(
                req.user.id,
                question
            );

        res.status(200).json({
            success: true,
            data: {
                answer
            }
        });
    } catch (error) {
        next(error);
    }
}

// Generate Expense Forecast
async function generateExpenseForecast(
    req,
    res,
    next
) {
    try {
        const prediction =
            await aiService.generateExpenseForecast(
                req.user.id
            );
        res.status(200).json({
            success: true,
            data: {
                prediction
            }
        });

    } catch (error) {
        next(error);
    }
}


// Detect Spending Anomalies
async function detectSpendingAnomalies(
    req,
    res,
    next
) {

    try {
        const anomaly =
            await aiService
                .detectSpendingAnomalies(
                    req.user.id
                );
        res.status(200).json({
            success: true,
            data: {
                anomaly
            }
        });

    } catch (error) {
        next(error);
    }
}

// Generate Budget Recommendations
async function generateBudgetRecommendations(
    req,
    res,
    next
) {
    try {
        const recommendation =
            await aiService
                .generateBudgetRecommendations(
                    req.user.id
                );

        res.status(200).json({
            success: true,
            data: {
                recommendation
            }
        });

    } catch (error) {
        next(error);
    }
}

// Natural Language Expense Entry
async function parseExpense(req, res, next) {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Expense description is required'
            });
        }
        const result = await aiService.parseAndCreateExpense(req.user.id, text);
        res.status(201).json({
            success: true,
            message: 'Expense recorded successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

// Monthly Report
async function monthlyReport(req, res, next) {
    try {
        const result = await aiService.generateMonthlyReport(req.user.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    generateInsights,
    generateMonthlySummary,
    generateSavingsSuggestions,
    chatWithAI,
    generateExpenseForecast,
    detectSpendingAnomalies,
    generateBudgetRecommendations,
    parseExpense,
    monthlyReport
};
   