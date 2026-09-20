import api from '../lib/axios';

const LIVE_BASE = '/api/v1/livestreams';

const liveStreamService = {
  getActiveLiveStreams: async () => {
    try {
      const response = await api.get(`${LIVE_BASE}/active`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getLiveStreamDetail: async (id) => {
    try {
      const response = await api.get(`${LIVE_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  joinLiveStream: async (id, guestName) => {
    try {
      const params = guestName ? { guestName } : {};
      const response = await api.get(`${LIVE_BASE}/${id}/join`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  likeLiveStream: async (id) => {
    try {
      const response = await api.post(`${LIVE_BASE}/${id}/like`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default liveStreamService;
