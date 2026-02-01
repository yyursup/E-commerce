import api from '../lib/axios';

const PRODUCT_BASE = '/api/v1/product';

const productService = {
  getProducts: async (params = {}) => {
    try {
      const response = await api.get(PRODUCT_BASE, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getProductById: async (productId) => {
    try {
      const response = await api.get(`${PRODUCT_BASE}/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default productService;
