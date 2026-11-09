import axiosClient from '../api/axiosClient'

const WALLET_BASE = '/api/v1/wallet'

const walletService = {
  getMyWallet: async () => {
    try {
      const response = await axiosClient.get(`${WALLET_BASE}/me`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
  getAdminWallet: async (userName) => {
    try {
      const response = await axiosClient.get(`${WALLET_BASE}/admin`, {
        params: { userName },
      })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
  updateBankInfo: async (data) => {
    try {
      const response = await axiosClient.put(`${WALLET_BASE}/bank-info`, data)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
  requestWithdrawal: async (data) => {
    try {
      const response = await axiosClient.post(`${WALLET_BASE}/withdraw`, data)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
  getMyWithdrawals: async (params) => {
    try {
      const response = await axiosClient.get(`${WALLET_BASE}/withdrawals`, { params })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
  cancelWithdrawal: async (id) => {
    try {
      const response = await axiosClient.post(`${WALLET_BASE}/withdrawals/${id}/cancel`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default walletService
