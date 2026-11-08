import axiosClient from '../api/axiosClient'

const VOUCHER_BASE = '/api/v1/vouchers'

export const voucherService = {
  // Lấy danh sách voucher toàn sàn (cho Admin)
  getPlatformVouchers: async () => {
    try {
      const response = await axiosClient.get(`${VOUCHER_BASE}/platform-manage`)
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
  },

  // Cập nhật voucher toàn sàn (cho Admin)
  updateVoucher: async (id, payload) => {
    try {
      const response = await axiosClient.put(`${VOUCHER_BASE}/${id}`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Xóa mềm / Kết thúc sớm voucher toàn sàn (cho Admin)
  deleteVoucher: async (id) => {
    try {
      const response = await axiosClient.delete(`${VOUCHER_BASE}/${id}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  }
}

export default voucherService
