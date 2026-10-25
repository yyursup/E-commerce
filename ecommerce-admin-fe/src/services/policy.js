import axiosClient from '../api/axiosClient'

const BASE_URL = '/api/v1/policies'
const ADMIN_BASE_URL = '/api/v1/admin/policies'

const policyService = {
  // Public APIs (usable anywhere)
  getActivePolicies: async (params) => {
    try {
      const response = await axiosClient.get(BASE_URL, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getPolicyByKey: async (policyKey) => {
    try {
      const response = await axiosClient.get(`${BASE_URL}/${policyKey}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Admin APIs
  getAllPoliciesAdmin: async () => {
    try {
      const response = await axiosClient.get(ADMIN_BASE_URL)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  getPolicyByIdAdmin: async (id) => {
    try {
      const response = await axiosClient.get(`${ADMIN_BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  createPolicy: async (payload) => {
    try {
      const response = await axiosClient.post(ADMIN_BASE_URL, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  updatePolicy: async (id, payload) => {
    try {
      const response = await axiosClient.put(`${ADMIN_BASE_URL}/${id}`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  deletePolicy: async (id) => {
    try {
      const response = await axiosClient.delete(`${ADMIN_BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Dispute Clauses Admin APIs
  getAllDisputeClausesAdmin: async (params) => {
    try {
      const response = await axiosClient.get(`${ADMIN_BASE_URL}/dispute-clauses`, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  createDisputeClause: async (payload) => {
    try {
      const response = await axiosClient.post(`${ADMIN_BASE_URL}/dispute-clauses`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  updateDisputeClause: async (id, payload) => {
    try {
      const response = await axiosClient.put(`${ADMIN_BASE_URL}/dispute-clauses/${id}`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  deleteDisputeClause: async (id) => {
    try {
      const response = await axiosClient.delete(`${ADMIN_BASE_URL}/dispute-clauses/${id}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default policyService
