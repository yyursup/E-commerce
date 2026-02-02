import axiosClient from '../api/axiosClient';

const CART_BASE = '/api/v1/cart';

const cartService = {
  getCart: async () => {
    try {
      const response = await axiosClient.get(CART_BASE);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await axiosClient.post(`${CART_BASE}/items`, {
        productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  increaseQuantity: async (cartItemId) => {
    try {
      const response = await axiosClient.post(`${CART_BASE}/items/${cartItemId}/plus`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  decreaseQuantity: async (cartItemId) => {
    try {
      const response = await axiosClient.post(`${CART_BASE}/items/${cartItemId}/minus`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  removeItem: async (cartItemId) => {
    try {
      const response = await axiosClient.delete(`${CART_BASE}/items/${cartItemId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default cartService;
