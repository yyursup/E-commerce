

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

  handleReport: async (
    requestId,
    decision,
    note = null,
    resolutionType = null,
    policyClauseCode = null,
    removeShopPenalty = null
  ) => {
    try {
      const payload = {
        decision,
        note,
        resolutionType,
        policyClauseCode,
      }
      if (removeShopPenalty !== null && removeShopPenalty !== undefined) {
        payload.removeShopPenalty = Boolean(removeShopPenalty)
      }
      const response = await axiosClient.put(`${REPORT_BASE}/${requestId}/handle`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getPolicyClauses: async () => {
    try {
      const response = await axiosClient.get(`${REPORT_BASE}/policy-clauses`)
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch policy clauses', error)
      return []
    }
  },

  cancelReport: async (reportId) => {
    try {
      const response = await axiosClient.put(`${REPORT_BASE}/${reportId}/cancel`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  sellerRespond: async (reportId, payload) => {
    try {
      const response = await axiosClient.post(`${REPORT_BASE}/${reportId}/seller-respond`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  escalateReport: async (reportId, payload = {}) => {
    try {
      const response = await axiosClient.post(`${REPORT_BASE}/${reportId}/escalate`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getReportByOrderId: async (orderId) => {
    try {
      const response = await axiosClient.get(`${REPORT_BASE}/by-order/${orderId}`)
      return response.data || null
    } catch (error) {
      if (error?.response?.status === 204) return null
      throw error.response ? error.response.data : error
    }
  },
}

export default reportService

