import axiosClient from '../api/axiosClient'

export const chatService = {
  getThreads: async () => {
    const res = await axiosClient.get('/api/v1/chat/threads')
    return res.data
  },

  getOrCreateSupportThread: async () => {
    const res = await axiosClient.post('/api/v1/chat/threads/support')
    return res.data
  },

  getOrCreateShopThread: async (shopId) => {
    const res = await axiosClient.post(`/api/v1/chat/threads/shop/${shopId}`)
    return res.data
  },

  getThreadById: async (threadId) => {
    const res = await axiosClient.get(`/api/v1/chat/threads/${threadId}`)
    return res.data
  },

  getMessages: async (threadId, page = 0, size = 30) => {
    const res = await axiosClient.get(`/api/v1/chat/threads/${threadId}/messages`, {
      params: { page, size },
    })
    return res.data
  },

  sendMessage: async (threadId, content, recipientId = null) => {
    const res = await axiosClient.post(`/api/v1/chat/threads/${threadId}/messages`, {
      content,
      recipientId,
    })
    return res.data
  },

  sendImage: async (threadId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await axiosClient.post(`/api/v1/chat/threads/${threadId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  markRead: async (threadId) => {
    const res = await axiosClient.put(`/api/v1/chat/threads/${threadId}/read`)
    return res.data
  },

  closeThread: async (threadId) => {
    const res = await axiosClient.put(`/api/v1/chat/threads/${threadId}/close`)
    return res.data
  },
}

export default chatService
