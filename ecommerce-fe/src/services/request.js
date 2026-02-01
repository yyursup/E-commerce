import api from '../lib/axios';

const REQUEST_BASE = '/api/v1/request';

const requestService = {
  registerSeller: async (payload) => {
    try {
      const response = await api.post(`${REQUEST_BASE}/regis-seller`, payload);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getRequests: async (params) => {
    try {
      const response = await api.get(REQUEST_BASE, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getRequestDetails: async (requestId) => {
    try {
      const response = await api.get(`${REQUEST_BASE}/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default requestService;
