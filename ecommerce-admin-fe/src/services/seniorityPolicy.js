import axiosClient from '../api/axiosClient'

const SENIORITY_BASE = '/api/v1/platform/seniority-policies'

const seniorityPolicyService = {
  getAll: async () => {
    try {
      const response = await axiosClient.get(SENIORITY_BASE)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  update: async (id, payload) => {
    try {
      const response = await axiosClient.put(`${SENIORITY_BASE}/${id}`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  create: async (payload) => {
    try {
      const response = await axiosClient.post(SENIORITY_BASE, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosClient.delete(`${SENIORITY_BASE}/${id}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default seniorityPolicyService
