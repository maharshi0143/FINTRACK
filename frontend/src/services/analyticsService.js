import api from './api';

export const analyticsService = {
  getSummary: () =>
    api.get('/analytics/summary'),

  getMonthly: () =>
    api.get('/analytics/monthly'),

  getCategory: () =>
    api.get('/analytics/category'),

  getTopExpenses: () =>
    api.get('/analytics/top-expenses'),

  getDashboard: () =>
    api.get('/analytics/dashboard'),
};
