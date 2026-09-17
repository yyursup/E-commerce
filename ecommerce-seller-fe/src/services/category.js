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
};

export default categoryService;
