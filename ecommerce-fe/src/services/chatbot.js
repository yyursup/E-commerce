import axiosClient from '../api/axiosClient'

const CHAT_BASE = '/api/v1/chat'

/**
 * Chatbot API (Stateless REST on backend).
 * GET /api/v1/chat/init  -> { currentNodeId, messageText, options, productCards, inputExpected, inputHint, ... }
 * POST /api/v1/chat/interact -> body: { action?, text?, categoryId?, currentNodeId? } -> same shape
 */
const chatbotService = {
  /**
   * Khởi tạo / lấy trạng thái root.
   * @returns {Promise<{ currentNodeId: string, messageText: string, options: Array<{buttonLabel, actionPayload, nextNodeId, categoryId}>, productCards: Array<{id, name, basePrice, productUrl, thumbnailUrl}>, humanHandoffRequired: boolean, inputExpected: boolean, inputHint?: string }>}
   */
  init: async () => {
    const response = await axiosClient.get(`${CHAT_BASE}/init`)
    return response.data
  },

  /**
   * Gửi thao tác (bấm nút) hoặc tin nhắn text statelessly.
   * @param {{ action?: string, text?: string, categoryId?: string, currentNodeId?: string }} payload
   */
  interact: async (payload) => {
    const response = await axiosClient.post(`${CHAT_BASE}/interact`, payload)
    return response.data
  },
}

export default chatbotService
