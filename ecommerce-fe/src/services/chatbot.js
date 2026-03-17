import axiosClient from '../api/axiosClient'

const CHAT_BASE = '/api/v1/chat'

/**
 * Chatbot API (session-based on backend; gửi kèm cookie/token nếu có).
 * GET /api/v1/chat/init  -> { messageText, options, productCards, inputExpected, inputHint, ... }
 * POST /api/v1/chat/interact -> body: { action? | text?, categoryId? } -> same shape
 */
const chatbotService = {
  /**
   * Khởi tạo / lấy trạng thái hiện tại.
   * @returns {Promise<{ messageText: string, options: Array<{buttonLabel, actionPayload, nextNodeId, categoryId}>, productCards: Array<{id, name, basePrice, productUrl, thumbnailUrl}>, humanHandoffRequired: boolean, liveChatSessionId?: string, inputExpected: boolean, inputHint?: string }>}
   */
  init: async () => {
    const response = await axiosClient.get(`${CHAT_BASE}/init`, {
      withCredentials: true,
    })
    return response.data
  },

  /**
   * Gửi thao tác (bấm nút) hoặc tin nhắn text.
   * @param {{ action?: string, text?: string, categoryId?: string }} payload
   */
  interact: async (payload) => {
    const response = await axiosClient.post(`${CHAT_BASE}/interact`, payload, {
      withCredentials: true,
    })
    return response.data
  },
}

export default chatbotService
