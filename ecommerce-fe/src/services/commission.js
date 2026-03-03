import axiosClient from '../api/axiosClient';

const COMMISSION_BASE = '/api/v1/commissions';

const commissionService = {
    // --- Statistical APIs for Admin ---

    /**
     * Get overview statistics of commissions
     * Returns: { totalCommission, totalOrders, averageCommissionRate }
     */
    getOverview: async () => {
        try {
            const response = await axiosClient.get(`${COMMISSION_BASE}/overview`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Get commission statistics grouped by month
     * Returns: Array of { year, month, totalCommission }
     */
    getByMonth: async () => {
        try {
            const response = await axiosClient.get(`${COMMISSION_BASE}/by-month`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Get top sellers based on commission amount
     * @param {number} limit - Number of top sellers to fetch
     * Returns: Array of { sellerId, shopName, totalCommission }
     */
    getTopSellers: async (limit = 5) => {
        try {
            const response = await axiosClient.get(`${COMMISSION_BASE}/top-sellers`, {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // --- Commission Management APIs ---

    /**
     * Get list of commissions with filters
     * @param {Object} filter - { from, to, sellerName }
     */
    getCommissions: async (filter = {}) => {
        try {
            const response = await axiosClient.get(COMMISSION_BASE, { params: filter });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Trigger commission creation for a specific order (Admin/System use)
     */
    createCommission: async (orderId) => {
        try {
            const response = await axiosClient.post(`${COMMISSION_BASE}/orders/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Get detailed commission info for an order
     */
    getByOrderId: async (orderId) => {
        try {
            const response = await axiosClient.get(`${COMMISSION_BASE}/orders/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // --- Seller Statistics APIs (authenticated seller) ---

    /**
     * Get total commission for the currently logged-in seller
     * No sellerId needed — backend reads from auth token
     */
    getTotalCommissionBySeller: async () => {
        try {
            const response = await axiosClient.get(`${COMMISSION_BASE}/sellers/total`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Get net income (Total - Commission) for the currently logged-in seller
     * No sellerId needed — backend reads from auth token
     */
    getTotalNetIncomeBySeller: async () => {
        try {
            const response = await axiosClient.get(`${COMMISSION_BASE}/sellers/net-income`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default commissionService;
