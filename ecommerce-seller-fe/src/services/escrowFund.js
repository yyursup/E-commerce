import axiosClient from '../api/axiosClient'

const ESCROW_FUND_BASE = '/api/v1/shop-escrow-fund'
const TRUST_LEVELS_BASE = '/api/v1/trust-levels'

const escrowFundService = {
  getMyFund: async () => {
    try {
      const response = await axiosClient.get(`${ESCROW_FUND_BASE}/my-fund`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getMyTransactions: async (params = {}) => {
    try {
      const response = await axiosClient.get(`${ESCROW_FUND_BASE}/my-fund/transactions`, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  topUpFund: async (payload) => {
    try {
      const response = await axiosClient.post(`${ESCROW_FUND_BASE}/top-up`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  createVnpayPayment: async (payload) => {
    try {
      const response = await axiosClient.post(`${ESCROW_FUND_BASE}/vnpay/create-payment`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  requestCloseShopRefund: async () => {
    try {
      const response = await axiosClient.post(`${ESCROW_FUND_BASE}/request-refund`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getTrustLevels: async () => {
    try {
      const response = await axiosClient.get(TRUST_LEVELS_BASE)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  }
}

export default escrowFundService
