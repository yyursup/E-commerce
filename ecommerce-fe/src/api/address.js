import api from './client'

const ADDRESS_BASE = '/address'

export const listAddresses = () => api.get(ADDRESS_BASE)
export const createAddress = payload => api.post(ADDRESS_BASE, payload)
export const updateAddress = (id, payload) =>
  api.put(`${ADDRESS_BASE}/${id}`, payload)
export const deleteAddress = id => api.delete(`${ADDRESS_BASE}/${id}`)
export const setDefaultAddress = id =>
  api.patch(`${ADDRESS_BASE}/${id}/default`)
