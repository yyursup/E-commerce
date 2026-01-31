import api from './client'

export const confirmCheckout = shopId => api.get('/checkout/confirm', { params: { shopId } })
export const quoteCheckout = payload => api.post('/checkout/quote', payload)
