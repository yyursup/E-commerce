import api from './client'

const REQUEST_BASE = '/request'

export const registerSeller = payload => api.post(`${REQUEST_BASE}/regis-seller`, payload)
export const reportShop = payload => api.post(`${REQUEST_BASE}/report`, payload)

export const approveRequest = (requestId, response) =>
  api.put(`${REQUEST_BASE}/approve`, null, { params: { requestId, response } })
export const rejectRequest = (requestId, response) =>
  api.put(`${REQUEST_BASE}/reject`, null, { params: { requestId, response } })

export const getRequests = params => api.get(REQUEST_BASE, { params })
export const getRequestDetails = id => api.get(`${REQUEST_BASE}/${id}`)
