import axiosClient from '../api/axiosClient';

const ORDER_BASE = '/api/v1/order';

const orderService = {
  // Customer: Get my order details
  getMyOrderById: async (orderId) => {
    try {
      const response = await axiosClient.get(`${ORDER_BASE}/${orderId}/me`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Customer: List my orders
  getMyOrders: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axiosClient.get(`${ORDER_BASE}/me`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Business: Get shop order details
  getShopOrderById: async (orderId) => {
    try {
      const response = await axiosClient.get(`${ORDER_BASE}/shops/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Business: List shop orders
  getShopOrders: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axiosClient.get(`${ORDER_BASE}/shops`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Admin: Get order details
  getOrderById: async (orderId) => {
    try {
      const response = await axiosClient.get(`${ORDER_BASE}/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Admin: List all orders
  getAllOrders: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await axiosClient.get(ORDER_BASE, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default orderService;
