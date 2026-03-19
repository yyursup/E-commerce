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
}

export default walletService
