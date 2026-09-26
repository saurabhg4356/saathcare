import axios from 'axios';

export const notificationService = {
  async getNotifications(params = {}) {
    const response = await axios.get('/api/notifications', { params });
    return response.data?.data || { notifications: [], unreadCount: 0 };
  },

  async markAsRead(id) {
    const response = await axios.patch(`/api/notifications/${id}/read`);
    return response.data?.data;
  },

  async markAllAsRead() {
    const response = await axios.patch('/api/notifications/read-all');
    return response.data?.data;
  }
};
