import axiosClient from '../api/axiosClient';

const PLATFORM_BASE = '/api/v1/platform';

const platformService = {
  // Get platform settings
  getPlatformSettings: async () => {
    try {
      const response = await axiosClient.get(PLATFORM_BASE);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update commission rate
  updateCommissionRate: async (commissionRate) => {
    try {
      const response = await axiosClient.patch(PLATFORM_BASE, {
        commissionRate,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default platformService;
