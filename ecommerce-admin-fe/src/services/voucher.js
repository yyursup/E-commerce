import axiosClient from '../api/axiosClient'

const VOUCHER_BASE = '/api/v1/vouchers'

export const voucherService = {
  // Lấy danh sách voucher toàn sàn (cho Admin)
  getPlatformVouchers: async (params = {}) => {
    try {
      const response = await axiosClient.get(VOUCHER_BASE, {
        params: { scope: 'PLATFORM', ...params }
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Tạo mới voucher toàn sàn (Sàn tài trợ)
  createPlatformVoucher: async (payload) => {
    try {
      const response = await axiosClient.post(VOUCHER_BASE, {
        ...payload,
        scope: 'PLATFORM'
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  }
}

export default voucherService
