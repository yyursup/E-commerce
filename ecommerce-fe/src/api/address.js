import api from './client'

export const listAddresses = () => api.get('/address')
export const createAddress = payload => api.post('/address', payload)
export const updateAddress = (id, payload) => api.put(`/address/${id}`, payload)
export const deleteAddress = id => api.delete(`/address/${id}`)
export const setDefaultAddress = id => api.patch(`/address/${id}/default`)
