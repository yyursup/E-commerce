import api from './client'

const SHIPPING_BASE = '/shipping'

export const getProvinces = () => api.get(`${SHIPPING_BASE}/provinces`)
export const calculateFee = payload =>
  api.post(`${SHIPPING_BASE}/fee`, payload)
