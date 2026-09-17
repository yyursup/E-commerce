import axiosClient from '../api/axiosClient';

const NOTIFICATION_BASE = '/api/v1/notifications';

const notificationService = {
  getMyNotifications: async (page = 0, size = 20) => {
    try {
      const response = await axiosClient.get(`${NOTIFICATION_BASE}/my`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await axiosClient.get(`${NOTIFICATION_BASE}/unread-count`);
      return response.data?.unreadCount || 0;
    } catch (error) {
      return 0;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await axiosClient.put(`${NOTIFICATION_BASE}/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await axiosClient.put(`${NOTIFICATION_BASE}/read-all`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default notificationService;
