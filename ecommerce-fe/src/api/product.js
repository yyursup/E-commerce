import api from './client'

export const getPublishedProducts = params => api.get('/product', { params })
export const getPublishedProduct = productId => api.get(`/product/${productId}`)

// Seller endpoints
export const createProduct = payload => api.post('/seller', payload)
export const updateProduct = (productId, payload) => api.put(`/seller/${productId}`, payload)
export const deleteProduct = productId => api.delete(`/seller/${productId}`)
export const getSellerProduct = productId => api.get(`/seller/${productId}`)
export const getProductsByShop = status => api.get('/seller/by-shop', { params: status ? { status } : {} })
