import api from './client'

const PRODUCT_BASE = '/product'
const SELLER_BASE = '/seller'

export const getPublishedProducts = params =>
  api.get(PRODUCT_BASE, { params })
export const getPublishedProduct = productId =>
  api.get(`${PRODUCT_BASE}/${productId}`)

// Seller endpoints
export const createProduct = payload => api.post(SELLER_BASE, payload)
export const updateProduct = (productId, payload) =>
  api.put(`${SELLER_BASE}/${productId}`, payload)
export const deleteProduct = productId =>
  api.delete(`${SELLER_BASE}/${productId}`)
export const getSellerProduct = productId =>
  api.get(`${SELLER_BASE}/${productId}`)
export const getProductsByShop = status =>
  api.get(`${SELLER_BASE}/by-shop`, { params: status ? { status } : {} })
