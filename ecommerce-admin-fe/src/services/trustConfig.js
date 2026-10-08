import axiosClient from '../api/axiosClient'

const TRUST_BASE = '/api/v1/trust-levels'
const ESCROW_FUND_BASE = '/api/v1/shop-escrow-fund'

const trustConfigService = {
  // Quản lý cấu hình 5 bậc sao
  getAdminTrustLevels: async () => {
    try {
      const response = await axiosClient.get(`${TRUST_BASE}/admin`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  updateTrustLevel: async (starLevel, payload) => {
    try {
      const response = await axiosClient.put(`${TRUST_BASE}/admin/${starLevel}`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  resetDefaultTrustLevels: async () => {
    try {
      const response = await axiosClient.post(`${TRUST_BASE}/admin/reset-defaults`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Giám sát Quỹ ký quỹ toàn sàn
  getAdminEscrowFunds: async (params = {}) => {
    try {
      const response = await axiosClient.get(`${ESCROW_FUND_BASE}/admin`, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getFundTransactions: async (fundId, params = {}) => {
    try {
      const response = await axiosClient.get(`${ESCROW_FUND_BASE}/admin/${fundId}/transactions`, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  deductCompensation: async (shopId, payload) => {
    try {
      const response = await axiosClient.post(`${ESCROW_FUND_BASE}/admin/${shopId}/deduct`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  adjustShopFund: async (shopId, payload) => {
    try {
      const response = await axiosClient.put(`${ESCROW_FUND_BASE}/admin/${shopId}/adjust`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  approveCloseShopRefund: async (shopId) => {
    try {
      const response = await axiosClient.post(`${ESCROW_FUND_BASE}/admin/${shopId}/approve-close-refund`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  rejectCloseShopRefund: async (shopId, reason) => {
    try {
      const response = await axiosClient.post(`${ESCROW_FUND_BASE}/admin/${shopId}/reject-close-refund`, { reason })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  }
}

export default trustConfigService
