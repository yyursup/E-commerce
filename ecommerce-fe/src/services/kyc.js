import api from '../lib/axios';

const KYC_BASE = '/api/v1/kyc';

const toFormData = (fields) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  return form;
};

const kycService = {
  startSession: async () => {
    try {
      const response = await api.post(`${KYC_BASE}/sessions:start`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  fullFlowUpload: async ({ sessionId, file, title, description }) => {
    try {
      const form = toFormData({ file, title, description });
      const response = await api.post(
        `${KYC_BASE}/sessions/${sessionId}/fullFlow-upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  uploadWithType: async ({ sessionId, type, file, title, description }) => {
    try {
      const form = toFormData({ file, title, description, type });
      const response = await api.post(
        `${KYC_BASE}/session/${sessionId}/upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  compare: async (sessionId) => {
    try {
      const response = await api.post(`${KYC_BASE}/sessions/${sessionId}/compare`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default kycService;
