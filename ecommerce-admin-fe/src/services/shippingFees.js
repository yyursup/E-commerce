import axiosClient from '../api/axiosClient'

const BASE = '/api/v1/shipping-fees'

const shippingFeeService = {
  // direction: 'OUTBOUND' (shop tạo đơn GHN giao cho người mua) | 'RETURN' (người mua tạo đơn trả hàng) | bỏ trống = cả hai
  list: async (params) => {
    try {
      const response = await axiosClient.get(BASE, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  summary: async () => {
    try {
      const response = await axiosClient.get(`${BASE}/summary`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default shippingFeeService
