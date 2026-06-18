import api from './api';

export const profileService = {
  get: () =>
    api.get('/profile'),

  update: (data) =>
    api.put('/profile', data),

  changePassword: (currentPassword, newPassword) =>
    api.put('/profile/password', { currentPassword, newPassword }),

  deleteAccount: () =>
    api.delete('/profile'),
};
