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
  getProductsByShop: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axiosClient.get(`${SELLER_BASE}/by-shop`, { params });
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
};

export default sellerService;
