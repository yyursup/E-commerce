import axiosClient from '../api/axiosClient';

const ORDER_BASE = '/api/v1/order';
const PAYMENT_BASE = '/api/v1/payment';

const orderService = {
    // Create Order
    createOrder: async (shopId, addressId, notes) => {
        try {
            const response = await axiosClient.post(ORDER_BASE, {
                shopId,
                addressId,
                notes
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Get My Orders
    getMyOrders: async (params = {}) => {
        try {
            // User endpoint is /order/me
            const response = await axiosClient.get(`${ORDER_BASE}/me`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Get Order Detail
    getOrderById: async (orderId) => {
        try {
            // User endpoint for detail is /order/{id}/me
            const response = await axiosClient.get(`${ORDER_BASE}/${orderId}/me`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Create VNPay Payment URL
    createPayment: async (orderId) => {
        try {
            const response = await axiosClient.post(`${PAYMENT_BASE}/orders/${orderId}/vnpay`);
            return response.data; // Expect { paymentUrl: '...' }
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};

export default orderService;
