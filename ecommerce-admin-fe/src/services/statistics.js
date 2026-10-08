import axiosClient from '../api/axiosClient';

const STATISTICS_BASE = '/api/v1/statistics';

const statisticsService = {
    /**
     * Get full platform dashboard analytics for Admin
     */
    getAdminDashboardAnalytics: async () => {
        try {
            const response = await axiosClient.get(`${STATISTICS_BASE}/admin/dashboard`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default statisticsService;
