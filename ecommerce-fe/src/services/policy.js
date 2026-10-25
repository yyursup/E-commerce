import axiosClient from '../api/axiosClient'

const BASE_URL = '/api/v1/policies'

const policyService = {
  // Get active policies (optionally filter by audience: 'ALL', 'BUYER', 'SELLER' or category)
  getActivePolicies: async (params) => {
    try {
      const response = await axiosClient.get(BASE_URL, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Get single policy by key
  getPolicyByKey: async (policyKey) => {
    try {
      const response = await axiosClient.get(`${BASE_URL}/${policyKey}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default policyService
