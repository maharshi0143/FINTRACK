const Groq = require('groq-sdk');
const analyticsRepository = require('../repositories/analytics.repository');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Generate Insights
async function generateInsights(income, expense, topCategory){
    const prompt = `
    Monthly income: ₹${income}
    Monthly expense: ₹${expense}
    Highest spending category: ${topCategory}

    Talk to me like a friend — natural and human, no AI jargon. Keep it 2-3 lines. Give both insight and a practical suggestion.
    `;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: 'You are a financially-savvy friend. Talk directly, naturally — no fluff, no "based on your data", no AI phrases. Reference the actual numbers (income, expense, savings) naturally in what you say. Point out the pattern and give a practical, actionable suggestion. Just real talk.'
            },
            {
                role: 'user',
                content: prompt
            }
        ]
    });
    return response.choices[0].message.content;
}

// Generate Monthly Summary
async function generateMonthlySummary(
    userId
) {

    const summary =
        await analyticsRepository
            .getSummary(userId);

    const categories =
        await analyticsRepository
            .getCategoryAnalytics(userId);

    const income =
        Number(summary.total_income);

    const expense =
        Number(summary.total_expense);

    const savings =
        income - expense;

    const topCategory =
        categories.length > 0
            ? categories[0].category
            : 'None';

    const prompt = `
    Monthly income: ₹${income}
    Monthly expenses: ₹${expense}
    Monthly savings: ₹${savings}
    Highest spending category: ${topCategory}

    Talk to me like a friend — natural and human, no AI jargon. Keep it 2-3 lines. Give both insight and a practical suggestion.
    `;

    const response =
        await groq.chat.completions.create({

            model:
                'llama-3.3-70b-versatile',

            messages: [
                {
                    role: 'system',
                    content: 'You are a financially-savvy friend. Talk directly, naturally — no fluff, no "based on your data", no AI phrases. Reference the actual numbers (income, expense, savings) naturally in what you say. Point out the pattern and give a practical, actionable suggestion. Just real talk.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]

        });

    return response
        .choices[0]
        .message
        .content;
}


// Generate Savings Suggestion
async function generateSavingsSuggestions(
    userId
) {

    const summary = await analyticsRepository
            .getSummary(userId);

    const categories = await analyticsRepository
            .getCategoryAnalytics(userId);

    const income = Number(summary.total_income);

    const expense = Number(summary.total_expense);

    const savings = income - expense;

    const categoryBreakdown =
        categories
            .map(
                category =>
                    `${category.category}: ₹${category.total}`
            )
            .join('\n');

    const prompt = `
    Monthly income: ₹${income}
    Monthly expense: ₹${expense}
    Monthly savings: ₹${savings}
    Expense categories:
    ${categoryBreakdown}

    Talk to me like a friend — natural and human, no AI jargon. Keep it 2-3 lines. Give specific saving suggestions based on my actual numbers.
    `;

    const response =
        await groq.chat.completions.create({

            model:
                'llama-3.3-70b-versatile',

            messages: [
                {
                    role: 'system',
                    content: 'You are a financially-savvy friend. Talk directly, naturally — no fluff, no "based on your data", no AI phrases. Reference the actual numbers (income, expense, savings, categories) naturally. Point out where the money is going and give 1-2 practical, actionable saving suggestions. Just real talk.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]

        });

    return response
        .choices[0]
        .message
        .content;
}

// Chat with AI
async function chatWithAI(
    userId,
    question
) {

    const summary =
        await analyticsRepository
            .getSummary(userId);

    const categories =
        await analyticsRepository
            .getCategoryAnalytics(userId);

    const income =
        Number(summary.total_income);

    const expense =
        Number(summary.total_expense);

    const savings =
        income - expense;

    const categoryBreakdown =
        categories
            .map(
                category =>
                    `${category.category}: ₹${category.total}`
            )
            .join('\n');

    const prompt = `
Monthly income: ₹${income}
Monthly expenses: ₹${expense}
Monthly savings: ₹${savings}
Expense categories:
${categoryBreakdown}

User question: ${question}

Talk to me like a friend — natural and human, no AI jargon. Reference my actual numbers when answering. Keep it 2-3 lines.
`;

    const response =
        await groq.chat.completions.create({

            model:
                'llama-3.3-70b-versatile',

            messages: [
                {
                    role: 'system',
                    content: 'You are a financially-savvy friend looking at my finances. Answer naturally using my actual numbers — no fluff, no "based on your data", no AI phrases. Just real talk.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]

        });

    return response
        .choices[0]
        .message
        .content;

}

// Generate Expenses Forecast
async function generateExpenseForecast(
    userId
) {

    const monthlyData =
        await analyticsRepository
            .getMonthlyAnalytics(
                userId
            );

    if (monthlyData.length === 0) {
        return "You don't have enough transaction history yet. Start tracking your expenses for a few months and I'll be able to predict your future spending!";
    }

    const monthlyExpenses =
        monthlyData
            .map(
                month =>
                    `${month.month}: ₹${month.expense}`
            )
            .join('\n');

    const prompt = `
Here are my monthly expenses:
${monthlyExpenses}

Based on this trend, what do you think I'll spend next month? Talk to me like a friend — natural and human, no AI jargon. Keep it 2-3 lines.
`;
    const response =
        await groq.chat.completions.create({
            model:
                'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a financially-savvy friend looking at someone\'s expense history. Predict their next month\'s spending naturally — no fluff, no "based on your data", no AI phrases. Just real talk.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
    return response
        .choices[0]
        .message
        .content;
}

// Anomaly Detection
async function detectSpendingAnomalies(
    userId
) {
    const monthlyData =
        await analyticsRepository
            .getMonthlyAnalytics(
                userId
            );

    if (monthlyData.length === 0) {
        return "Not enough data to spot anomalies yet. Keep tracking your expenses and check back after a few months!";
    }

    const spendingHistory =
        monthlyData
            .map(
                month =>
                    `${month.month}: ₹${month.expense}`
            )
            .join('\n');

    const prompt = `
Here are my monthly expenses:
${spendingHistory}

Look for any unusual spikes or drops in my spending. If nothing stands out, just say that. Talk to me like a friend — natural and human, no AI jargon. Keep it 2-3 lines.
`;

    const response =
        await groq.chat.completions.create({
            model:
                'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a financially-savvy friend looking at someone\'s expense history. Point out any unusual patterns naturally — no fluff, no "based on your data", no AI phrases. Just real talk.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
    return response
        .choices[0]
        .message
        .content;
}

// Budget recommendations
async function generateBudgetRecommendations(
    userId
) {

    const summary =
        await analyticsRepository
            .getSummary(
                userId
            );

    const categories =
        await analyticsRepository
            .getCategoryAnalytics(
                userId
            );

    if (categories.length === 0) {
        return "Start tracking your expenses first! Once you have some spending history, I'll suggest budgets for each category.";
    }

    const income =
        Number(summary.total_income);

    const expense =
        Number(summary.total_expense);

    const categoryBreakdown =
        categories
            .map(
                category =>
                    `${category.category}: ₹${category.total}`
            )
            .join('\n');

    const prompt = `
Monthly income: ₹${income}
Monthly expense: ₹${expense}
Expense categories:
${categoryBreakdown}

Based on my spending, suggest a reasonable monthly budget for each category. Talk to me like a friend — natural and human, no AI jargon. Keep it 2-3 lines.
`;

    const response =
        await groq.chat.completions.create({

            model:
                'llama-3.3-70b-versatile',

            messages: [
                {
                    role: 'system',
                    content: 'You are a financially-savvy friend. Suggest practical monthly budgets based on their actual spending — no fluff, no "based on your data", no AI phrases. Just real talk.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]

        });

    return response
        .choices[0]
        .message
        .content;

}

// Natural Language Expense Entry
async function parseAndCreateExpense(userId, text) {
    const prompt = `
Parse this expense description and return ONLY a JSON object with no other text:
"${text}"

Return JSON in this exact format:
{
    "title": "short title",
    "amount": number,
    "type": "expense",
    "category": "category name",
    "date": "YYYY-MM-DD",
    "notes": "optional note"
}

Rules:
- If no date mentioned, use today's date
- Amount should be a number (no currency symbols)
- Category should be one of: Food, Shopping, Travel, Entertainment, Education, Bills, Salary, Freelance, Bonus, Other
- Type is always "expense"
- Title should be 2-4 words describing the purchase
`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: 'You extract structured transaction data from natural language. Return ONLY valid JSON, no explanations.'
            },
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    let parsed;
    try {
        const content = response.choices[0].message.content.trim();
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        const jsonStr = content.substring(jsonStart, jsonEnd + 1);
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error('Failed to parse expense from your message. Try being more specific.');
    }

    if (!parsed.title || !parsed.amount || !parsed.category || !parsed.date) {
        throw new Error('Could not extract all details. Try: "Spent ₹450 on pizza yesterday"');
    }

    const transactionRepository = require('../repositories/transaction.repository');
    const transaction = await transactionRepository.createTransaction(
        userId,
        parsed.title,
        Number(parsed.amount),
        parsed.type || 'expense',
        parsed.category,
        parsed.date,
        parsed.notes || ''
    );

    const { getIO } = require('../socket/socket');
    getIO().to(userId).emit('transactionCreated', transaction);

    return { transaction, originalText: text };
}

// Monthly Report
async function generateMonthlyReport(userId) {
    const summary = await analyticsRepository.getSummary(userId);
    const monthlyData = await analyticsRepository.getMonthlyAnalytics(userId);
    const categories = await analyticsRepository.getCategoryAnalytics(userId);

    const income = Number(summary.total_income);
    const expense = Number(summary.total_expense);
    const savings = income - expense;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    const categoryBreakdown = categories
        .map(c => `${c.category}: ₹${c.total}`)
        .join('\n');

    const monthlyHistory = monthlyData
        .map(m => `${m.month}: Income ₹${m.income} / Expense ₹${m.expense}`)
        .join('\n');

    const prompt = `
Monthly Financial Report
Income: ₹${income}
Expenses: ₹${expense}
Savings: ₹${savings} (${savingsRate}% savings rate)

Category breakdown:
${categoryBreakdown}

Recent months:
${monthlyHistory}

Generate a friendly month-end financial report. Talk like a friend — natural, no AI jargon. Keep it 3-4 lines. Give a summary and one actionable suggestion.
`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: 'You are a financially-savvy friend writing a monthly report. Talk directly, naturally — no fluff, no AI phrases. Reference the actual numbers. Give a clear summary and one practical suggestion.'
            },
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    const report = response.choices[0].message.content;

    const aiChatRepository = require('../repositories/aiChat.repository');
    await aiChatRepository.createChat(userId, 'assistant', report);

    const notificationService = require('./notification.service');
    await notificationService.createNotification(
        userId,
        'Monthly Report Ready',
        report.substring(0, 100) + '...'
    );

    return { report, income, expense, savings, savingsRate };
}

module.exports = {
    generateInsights,
    generateMonthlySummary,
    generateSavingsSuggestions,
    chatWithAI,
    generateExpenseForecast,
    detectSpendingAnomalies,
    generateBudgetRecommendations,
    parseAndCreateExpense,
    generateMonthlyReport
};
