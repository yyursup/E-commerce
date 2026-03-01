import axiosClient from '../api/axiosClient'

const WALLET_BASE = '/api/v1/wallet'

const walletService = {
  getAdminWallet: async (accountId) => {
    try {
      const response = await axiosClient.get(`${WALLET_BASE}/admin/${accountId}`)
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default walletService
