import api from '../lib/axios';

const LIVE_BASE = '/api/v1/livestreams';

const liveStreamService = {
  createLiveStream: async (data) => {
    try {
      const response = await api.post(LIVE_BASE, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  startLiveStream: async (id) => {
    try {
      const response = await api.post(`${LIVE_BASE}/${id}/start`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  endLiveStream: async (id) => {
    try {
      const response = await api.post(`${LIVE_BASE}/${id}/end`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getMyStreams: async () => {
    try {
      const response = await api.get(`${LIVE_BASE}/my-streams`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getStreamDetail: async (id) => {
    try {
      const response = await api.get(`${LIVE_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  pinProduct: async (liveId, productId) => {
    try {
      const response = await api.post(`${LIVE_BASE}/${liveId}/pin/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  unpinProduct: async (liveId) => {
    try {
      const response = await api.post(`${LIVE_BASE}/${liveId}/unpin`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default liveStreamService;
