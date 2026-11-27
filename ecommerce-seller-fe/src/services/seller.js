import axiosClient from '../api/axiosClient';

const SELLER_BASE = '/api/v1/seller';

const sellerService = {
  // Create a new product
  createProduct: async (productData) => {
    try {
      const response = await axiosClient.post(SELLER_BASE, productData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get product by ID (seller's own product)
  getProductById: async (productId) => {
    try {
      const response = await axiosClient.get(`${SELLER_BASE}/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get products by shop with optional status filter
  // Danh sách sản phẩm của shop (phân trang, sản phẩm nổi bật đứng đầu)
  getProductsByShop: async ({ page = 0, size = 10, status, q } = {}) => {
    try {
      const params = { page, size };
      if (status) params.status = status;
      if (q && q.trim()) params.q = q.trim();
      const response = await axiosClient.get(`${SELLER_BASE}/by-shop`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getFeaturedCount: async () => {
    try {
      const response = await axiosClient.get(`${SELLER_BASE}/by-shop/featured-count`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update product
  updateProduct: async (productId, productData) => {
    try {
      const response = await axiosClient.put(`${SELLER_BASE}/${productId}`, productData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete product
  deleteProduct: async (productId) => {
    try {
      await axiosClient.delete(`${SELLER_BASE}/${productId}`);
      return true;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Toggle featured (đẩy/bỏ đẩy sản phẩm nổi bật)
  toggleFeatured: async (productId) => {
    try {
      const response = await axiosClient.patch(`${SELLER_BASE}/${productId}/featured`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get inventory history
  getInventoryHistory: async (page = 0, size = 20) => {
    try {
      const response = await axiosClient.get(`/api/v1/inventory-history/shop?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Calculate commission preview based on category & condition
  calculateCommissionPreview: async (categoryId, conditionGrade) => {
    try {
      const params = {};
      if (categoryId) params.categoryId = categoryId;
      if (conditionGrade) params.conditionGrade = conditionGrade;
      const response = await axiosClient.get('/api/v1/platform/commission/calculate-preview', { params });
      return response.data;
    } catch (error) {
      console.warn('Cannot preview commission rate:', error);
      return null;
    }
  },
};

export default sellerService;
