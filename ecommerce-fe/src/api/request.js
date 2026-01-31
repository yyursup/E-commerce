import api from './client'

export const registerSeller = payload => api.post('/request/regis-seller', payload)
export const reportShop = payload => api.post('/request/report', payload)

export const approveRequest = (requestId, response) =>
  api.put('/request/approve', null, { params: { requestId, response } })
export const rejectRequest = (requestId, response) =>
  api.put('/request/reject', null, { params: { requestId, response } })

export const getRequests = params => api.get('/request', { params })
export const getRequestDetails = id => api.get(`/request/${id}`)
