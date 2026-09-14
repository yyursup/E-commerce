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
  }
}

export default voucherService
