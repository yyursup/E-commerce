import axiosClient from '../api/axiosClient'

const chatbotService = {
  /**
   * Hỏi Trợ lý AI (Gemini + tool đọc dữ liệu sàn). Gửi toàn bộ lịch sử vì backend stateless.
   * @param {Array<{role: 'user'|'model', text: string}>} messages
   * @returns {Promise<{reply: string, productCards: Array<{id, name, basePrice, productUrl, thumbnailUrl}>}>}
   */
  ask: async (messages) => {
    try {
      const response = await axiosClient.post('/api/v1/chat/ai', { messages })
      return response.data
    } catch (error) {
      throw error.response ? error.response.data : error
    }
  },
}

export default chatbotService
