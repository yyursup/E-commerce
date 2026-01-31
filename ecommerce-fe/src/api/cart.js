import api from './client'

export const getCart = () => api.get('/cart')
export const addToCart = payload => api.post('/cart/items', payload)
export const increaseItem = cartItemId => api.post(`/cart/items/${cartItemId}/plus`)
export const decreaseItem = cartItemId => api.post(`/cart/items/${cartItemId}/minus`)
export const removeItem = cartItemId => api.delete(`/cart/items/${cartItemId}`)
