

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

