import axiosClient from '../api/axiosClient';

const WISHLIST_BASE = '/api/v1/wishlist';

const wishlistService = {
  toggleWishlist: async (productId) => {
    try {
      const response = await axiosClient.post(`${WISHLIST_BASE}/toggle/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getWishlistStatus: async (productId) => {
    try {
      const response = await axiosClient.get(`${WISHLIST_BASE}/status/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getMyWishlist: async (params = {}) => {
    try {
      const response = await axiosClient.get(`${WISHLIST_BASE}/my`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default wishlistService;
