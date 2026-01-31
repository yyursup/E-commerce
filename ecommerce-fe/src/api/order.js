import api from './client'

export const createOrder = payload => api.post('/order', payload)
export const updateOrderStatus = (orderId, status) =>
  api.patch(`/order/${orderId}/status`, null, { params: { status } })

export const listMyOrders = status =>
  api.get('/order/me', { params: status ? { status } : {} })
export const getMyOrderDetails = orderId =>
  api.get(`/order/${orderId}/me`)

export const listShopOrders = status =>
  api.get('/order/shops', { params: status ? { status } : {} })
export const getShopOrder = orderId =>
  api.get(`/order/shops/orders/${orderId}`)

export const adminListOrders = status =>
  api.get('/order', { params: status ? { status } : {} })
export const adminGetOrder = orderId => api.get(`/order/${orderId}`)
