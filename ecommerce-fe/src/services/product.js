import api from '../lib/axios'

const productService = {
    getAllProducts: async (params) => {
        // Endpoint based on ProductController: /api/v1/product
        // Query params: page, size, etc.
        const response = await api.get('/api/v1/product', { params })
        return response.data
    },

    getProductById: async (id) => {
        const response = await api.get(`/api/v1/product/${id}`)
        return response.data
    },
}

export default productService
