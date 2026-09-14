import axiosClient from '../api/axiosClient';

const VOUCHER_BASE = '/api/v1/vouchers';

export const voucherService = {
  // Lấy danh sách voucher active (có thể filter scope = PLATFORM | SHOP, shopId)
  listVouchers: async (params = {}) => {
    try {
      const response = await axiosClient.get(VOUCHER_BASE, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách voucher độc quyền của 1 Shop
  getShopVouchers: async (shopId) => {
    try {
      const response = await axiosClient.get(`${VOUCHER_BASE}/shop/${shopId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách voucher trong ví của user
  getMyVouchers: async () => {
    try {
      const response = await axiosClient.get(`${VOUCHER_BASE}/my-vouchers`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Thu thập / Lưu voucher vào ví
  claimVoucher: async (voucherId) => {
    try {
      const response = await axiosClient.post(`${VOUCHER_BASE}/${voucherId}/claim`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tính toán và xem trước số tiền giảm giá
  calculateDiscount: async (payload) => {
    try {
      const response = await axiosClient.post(`${VOUCHER_BASE}/calculate`, payload);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo voucher (cho Seller / Admin)
  createVoucher: async (payload) => {
    try {
      const response = await axiosClient.post(VOUCHER_BASE, payload);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách voucher do Shop quản lý (Seller)
  getShopManageVouchers: async () => {
    try {
      const response = await axiosClient.get(`${VOUCHER_BASE}/shop-manage`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default voucherService;
