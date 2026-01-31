import api from './client'

const ORDER_BASE = '/order'

export const createOrder = payload => api.post(ORDER_BASE, payload)
export const updateOrderStatus = (orderId, status) =>
  api.patch(`${ORDER_BASE}/${orderId}/status`, null, { params: { status } })

export const listMyOrders = status =>
  api.get(`${ORDER_BASE}/me`, { params: status ? { status } : {} })
export const getMyOrderDetails = orderId =>
  api.get(`${ORDER_BASE}/${orderId}/me`)

export const listShopOrders = status =>
  api.get(`${ORDER_BASE}/shops`, { params: status ? { status } : {} })
export const getShopOrder = orderId =>
  api.get(`${ORDER_BASE}/shops/orders/${orderId}`)

export const adminListOrders = status =>
  api.get(ORDER_BASE, { params: status ? { status } : {} })
export const adminGetOrder = orderId => api.get(`${ORDER_BASE}/${orderId}`)
