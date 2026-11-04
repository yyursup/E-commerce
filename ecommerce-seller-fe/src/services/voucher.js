import axiosClient from '../api/axiosClient'

const VOUCHER_BASE = '/api/v1/vouchers'

export const voucherService = {
  // Lấy danh sách voucher do Shop quản lý
  getShopManageVouchers: async () => {
    try {
      const response = await axiosClient.get(`${VOUCHER_BASE}/shop-manage`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Tạo mới voucher cho Shop
  createVoucher: async (payload) => {
    try {
      const response = await axiosClient.post(VOUCHER_BASE, {
        ...payload,
        scope: 'SHOP'
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Cập nhật voucher cho Shop
  updateVoucher: async (id, payload) => {
    try {
      const response = await axiosClient.put(`${VOUCHER_BASE}/${id}`, payload)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },

  // Xóa mềm / Kết thúc sớm voucher cho Shop
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
