import axiosClient from '../api/axiosClient'

const RETURN_BASE = '/api/v1/returns'

const returnService = {
  getReturnByOrderId: async (orderId) => {
    try {
      const response = await axiosClient.get(`${RETURN_BASE}/order/${orderId}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getReturnInfoBatch: async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return {}
    try {
      const response = await axiosClient.post(`${RETURN_BASE}/batch`, orderIds)
      return response.data || {}
    } catch (error) {
      console.error('Error fetching return batch:', error)
      return {}
    }
  },

  getReturnDetails: async (returnId) => {
    try {
      const response = await axiosClient.get(`${RETURN_BASE}/${returnId}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  submitTracking: async (returnIdOrPayload, payload) => {
    try {
      let returnId = returnIdOrPayload
      let body = payload
      if (typeof returnIdOrPayload === 'object' && returnIdOrPayload !== null) {
        returnId = returnIdOrPayload.returnId || returnIdOrPayload.id
        body = returnIdOrPayload
      }
      const response = await axiosClient.post(`${RETURN_BASE}/${returnId}/tracking`, body)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  confirmDelivered: async (returnId) => {
    try {
      const response = await axiosClient.post(`${RETURN_BASE}/${returnId}/confirm-delivered`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  confirmReturned: async (returnId) => {
    try {
      const response = await axiosClient.post(`${RETURN_BASE}/${returnId}/confirm-returned`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  completeReturn: async (returnIdOrPayload, payload) => {
    try {
      let returnId = returnIdOrPayload
      let body = payload
      if (typeof returnIdOrPayload === 'object' && returnIdOrPayload !== null) {
        returnId = returnIdOrPayload.returnId || returnIdOrPayload.id
        body = returnIdOrPayload
      }
      const response = await axiosClient.post(`${RETURN_BASE}/${returnId}/complete`, body)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  disputeReturn: async (returnIdOrPayload, payload) => {
    try {
      let returnId = returnIdOrPayload
      let body = payload
      if (typeof returnIdOrPayload === 'object' && returnIdOrPayload !== null) {
        returnId = returnIdOrPayload.returnId || returnIdOrPayload.id
        body = returnIdOrPayload
      }
      const response = await axiosClient.post(`${RETURN_BASE}/${returnId}/dispute`, body)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  resolveDispute: async (returnIdOrPayload, payload) => {
    try {
      let returnId = returnIdOrPayload
      let body = payload
      if (typeof returnIdOrPayload === 'object' && returnIdOrPayload !== null) {
        returnId = returnIdOrPayload.returnId || returnIdOrPayload.id
        body = returnIdOrPayload
      }
      const response = await axiosClient.post(`${RETURN_BASE}/${returnId}/resolve-dispute`, body)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default returnService
