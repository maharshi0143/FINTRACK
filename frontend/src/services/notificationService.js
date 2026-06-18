import api from './api';

export const notificationService = {
  getAll: () =>
    api.get('/notifications'),

  create: (title, message) =>
    api.post('/notifications', { title, message }),

  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  delete: (id) =>
    api.delete(`/notifications/${id}`),
};
