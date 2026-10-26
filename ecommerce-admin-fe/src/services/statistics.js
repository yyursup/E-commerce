import axiosClient from '../api/axiosClient';

const STATISTICS_BASE = '/api/v1/statistics';

const statisticsService = {
    /**
     * Get full platform dashboard analytics for Admin
     */
    getAdminDashboardAnalytics: async (params = {}) => {
        try {
            const response = await axiosClient.get(`${STATISTICS_BASE}/admin/dashboard`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Get shops performance list for Admin with period filter & search
     */
    getAdminShopsPerformance: async (params = {}) => {
        try {
            const response = await axiosClient.get(`${STATISTICS_BASE}/admin/shops/performance`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    /**
     * Get specific shop analytics drill-down for Admin
     */
    getAdminShopAnalytics: async (shopId, params = {}) => {
        try {
            const response = await axiosClient.get(`${STATISTICS_BASE}/admin/shops/${shopId}/analytics`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default statisticsService;
