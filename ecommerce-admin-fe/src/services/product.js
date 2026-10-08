import api from '../lib/axios';

const PRODUCT_BASE = '/api/v1/product';
const RECOMMENDATIONS_BASE = '/api/v1/recommendations';

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
      const response = await api.get(`${PRODUCT_BASE}/${productId}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getRecommendations: async (limit = 8) => {
    try {
      const response = await api.get(RECOMMENDATIONS_BASE, {
        params: { limit },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) return [];
      throw error.response ? error.response.data : error;
    }
  },

  getSimilarProducts: async (productId, limit = 8) => {
    try {
      const response = await api.get(`${PRODUCT_BASE}/${productId}/similar`, { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getPendingProducts: async () => {
    try {
      const response = await api.get('/api/v1/admin/products/pending');
      return response.data?.data || response.data || [];
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  approveProduct: async (productId) => {
    try {
      const response = await api.post(`/api/v1/admin/products/${productId}/approve`);
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  rejectProduct: async (productId, reason) => {
    try {
      const response = await api.post(`/api/v1/admin/products/${productId}/reject`, { reason });
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default productService;
