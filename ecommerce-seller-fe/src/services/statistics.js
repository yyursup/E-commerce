import axiosClient from '../api/axiosClient';

const STATISTICS_BASE = '/api/v1/statistics';

const statisticsService = {
    /**
     * Get deep seller analytics with sales timeline, top products, condition breakdown, and low stock
     */
    getSellerDashboardAnalytics: async () => {
        try {
            const response = await axiosClient.get(`${STATISTICS_BASE}/seller/dashboard`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default statisticsService;
