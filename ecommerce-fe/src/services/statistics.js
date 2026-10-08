import axiosClient from '../api/axiosClient';

const STATISTICS_BASE = '/api/v1/statistics';

const statisticsService = {
    /**
     * Get buyer personal spending analytics, voucher savings, smart tech savings, and purchased devices tracker
     */
    getBuyerSpendingAnalytics: async () => {
        try {
            const response = await axiosClient.get(`${STATISTICS_BASE}/buyer/spending`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default statisticsService;
