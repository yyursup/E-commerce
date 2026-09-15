import axiosClient from '../api/axiosClient';

const SOCIAL_BASE = '/api/v1/social/shop';

const socialService = {
  toggleFollowShop: async (shopId) => {
    try {
      const response = await axiosClient.post(`${SOCIAL_BASE}/toggle-follow/${shopId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getFollowStatus: async (shopId) => {
    try {
      const response = await axiosClient.get(`${SOCIAL_BASE}/follow-status/${shopId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default socialService;
