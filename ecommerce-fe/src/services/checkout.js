import axiosClient from '../api/axiosClient';

const CHECKOUT_BASE = '/api/v1/checkout';

const checkoutService = {
    // Confirm checkout (Get initial details + shipping fee for default address)
    confirm: async (shopId) => {
        try {
            const response = await axiosClient.get(`${CHECKOUT_BASE}/confirm`, {
                params: { shopId }
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Quote (Calculate fee when address changes)
    quote: async (shopId, addressId) => {
        try {
            // API expects QuoteRequest body: { shopId, addressId, notes? }
            // But looking at Backend Controller: @RequestBody QuoteRequest req
            // So we send POST
            const response = await axiosClient.post(`${CHECKOUT_BASE}/quote`, {
                shopId,
                addressId
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};

export default checkoutService;
