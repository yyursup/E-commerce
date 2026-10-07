import axiosClient from '../api/axiosClient'

const ESCROW_BASE = '/api/v1/escrow'

const escrowService = {
  getAdminEscrows: async (params) => {
    try {
      const response = await axiosClient.get(ESCROW_BASE, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  releaseByOrder: async (orderId, reason = null) => {
    try {
      const response = await axiosClient.post(`${ESCROW_BASE}/orders/${orderId}/release`, null, {
        params: reason ? { reason } : {},
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  refundByOrder: async (orderId, reason = null) => {
    try {
      const response = await axiosClient.post(`${ESCROW_BASE}/orders/${orderId}/refund`, null, {
        params: reason ? { reason } : {},
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  splitSettleByOrder: async (orderId, { buyerPercentage, sellerPercentage, note }) => {
    try {
      const response = await axiosClient.post(`${ESCROW_BASE}/orders/${orderId}/split-settle`, {
        buyerPercentage,
        sellerPercentage,
        note,
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getSettlementByOrderId: async (orderId) => {
    try {
      const response = await axiosClient.get(`${ESCROW_BASE}/orders/${orderId}/settlement`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default escrowService
