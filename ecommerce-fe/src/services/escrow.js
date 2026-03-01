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

  releaseByOrder: async (orderId) => {
    try {
      const response = await axiosClient.post(`${ESCROW_BASE}/orders/${orderId}/release`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default escrowService
