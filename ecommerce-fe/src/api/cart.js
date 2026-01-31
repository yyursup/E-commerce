import api from './client'

const CART_BASE = '/cart'

export const getCart = () => api.get(CART_BASE)
export const addToCart = payload => api.post(`${CART_BASE}/items`, payload)
export const increaseItem = cartItemId =>
  api.post(`${CART_BASE}/items/${cartItemId}/plus`)
export const decreaseItem = cartItemId =>
  api.post(`${CART_BASE}/items/${cartItemId}/minus`)
export const removeItem = cartItemId =>
  api.delete(`${CART_BASE}/items/${cartItemId}`)
