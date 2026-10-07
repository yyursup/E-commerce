import api from '../lib/axios';

const CATEGORY_BASE = '/api/v1/category';

const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await api.get(CATEGORY_BASE);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // Update category commission rate
  updateCommissionRate: async (categoryId, commissionRate) => {
    try {
      const response = await api.put(`${CATEGORY_BASE}/${categoryId}/commission-rate`, {
        commissionRate: Number(commissionRate),
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default categoryService;
