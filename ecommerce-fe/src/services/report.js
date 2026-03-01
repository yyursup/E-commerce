<<<<<<< HEAD
import axiosClient from '../api/axiosClient';

const REPORT_BASE = '/api/v1/report';

const reportService = {
    // User: Submit a report (for products, shops, etc.)
    submitReport: async (reportData) => {
        try {
            // Backend expects CreateReportRequest
            // Typically: { targetId, targetType, reason, description }
            const response = await axiosClient.post(REPORT_BASE, reportData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Admin: Handle/Resolve a report
    handleReport: async (requestId, { decision, note }) => {
        try {
            // Backend expects HandleReportRequest { decision, note }
            const response = await axiosClient.put(`${REPORT_BASE}/${requestId}/handle`, {
                decision,
                note
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};

export default reportService;
=======
import axiosClient from '../api/axiosClient'

const REPORT_BASE = '/api/v1/report'

const reportService = {
  createReport: async (payload) => {
    try {
      const response = await axiosClient.post(REPORT_BASE, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  handleReport: async (requestId, decision, note = null) => {
    try {
      const response = await axiosClient.put(`${REPORT_BASE}/${requestId}/handle`, {
        decision,
        note,
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default reportService
>>>>>>> 13b6d46300990b588086a88bd30d160deeb953ea
