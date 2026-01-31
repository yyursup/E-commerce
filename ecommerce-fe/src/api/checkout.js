import api from './client'

const CHECKOUT_BASE = '/checkout'

export const confirmCheckout = shopId =>
  api.get(`${CHECKOUT_BASE}/confirm`, { params: { shopId } })
export const quoteCheckout = payload =>
  api.post(`${CHECKOUT_BASE}/quote`, payload)
