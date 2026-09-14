import axiosClient from '../api/axiosClient';

const STATISTICS_BASE = '/api/v1/statistics';

const statisticsService = {
    /**
     * Get comprehensive statistics for the currently logged-in seller
     * Returns: { shopName, totalRevenue, estimatedRevenue, totalOrders, totalCommission, totalNetIncome, orderCountByStatus }
     */
    getSellerStatistics: async () => {
        try {
            const response = await axiosClient.get(STATISTICS_BASE);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default statisticsService;
