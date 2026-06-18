import api from './api';

export const aiService = {
  getInsights: (income, expense, topCategory) =>
    api.post('/ai/insights', { income, expense, topCategory }),

  getMonthlySummary: () =>
    api.get('/ai/monthly-summary'),

  getSavingsSuggestions: () =>
    api.get('/ai/savings-suggestions'),

  chat: (question) =>
    api.post('/ai/chat', { question }),

  getForecast: () =>
    api.get('/ai/forecast'),

  getAnomalies: () =>
    api.get('/ai/anomalies'),

  getBudgetRecommendations: () =>
    api.get('/ai/budget-recommendations'),

  parseExpense: (text) =>
    api.post('/ai/parse-expense', { text }),

  getMonthlyReport: () =>
    api.get('/ai/monthly-report'),
};
