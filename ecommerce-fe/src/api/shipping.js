import api from './client'

export const getProvinces = () => api.get('/shipping/provinces')
export const calculateFee = payload => api.post('/shipping/fee', payload)
