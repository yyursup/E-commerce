import axiosClient from '../api/axiosClient'

const BASE_URL = '/api/v1/policies'

const policyService = {
  // Get active policies (for seller portal, usually filters by audience=SELLER or ALL)
  getActivePolicies: async (params) => {
    try {
      const response = await axiosClient.get(BASE_URL, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Get policy by unique key
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
