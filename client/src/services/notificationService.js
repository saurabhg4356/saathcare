import api from './api.js';

export const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data || { notifications: [], unreadCount: 0 };
  },

  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};
