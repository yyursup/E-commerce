import { describe, it, expect, vi, beforeEach } from 'vitest'
import productService from '../../services/product'
import api from '../../lib/axios'

vi.mock('../../lib/axios', () => ({
  default: {
    get: vi.fn(),
  }
}))

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProducts', () => {
    it('should call GET /api/v1/product with params', async () => {
      const mockResponse = { data: { content: [] } }
      api.get.mockResolvedValueOnce(mockResponse)

      const result = await productService.getProducts({ page: 1, sort: 'price' })

      expect(api.get).toHaveBeenCalledWith('/api/v1/product', { params: { page: 1, sort: 'price' } })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getProductById', () => {
    it('should call GET /api/v1/product/:id with credentials', async () => {
      const mockResponse = { data: { id: 99, name: 'Laptop' } }
      api.get.mockResolvedValueOnce(mockResponse)

      const result = await productService.getProductById(99)

      expect(api.get).toHaveBeenCalledWith('/api/v1/product/99', { withCredentials: true })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getRecommendations', () => {
    it('should call GET recommendations and handle 401 gracefully', async () => {
      // Test successful call
      const mockResponse = { data: [{ id: 1 }] }
      api.get.mockResolvedValueOnce(mockResponse)
      
      let result = await productService.getRecommendations(5)
      expect(api.get).toHaveBeenCalledWith('/api/v1/recommendations', { params: { limit: 5 }, withCredentials: true })
      expect(result).toEqual(mockResponse.data)

      // Test 401 error (should return empty array instead of throwing)
      const error401 = { response: { status: 401, data: 'Unauthorized' } }
      api.get.mockRejectedValueOnce(error401)
      
      result = await productService.getRecommendations()
      expect(result).toEqual([])
    })

    it('should throw other errors normally', async () => {
      const error500 = { response: { status: 500, data: 'Server Error' } }
      api.get.mockRejectedValueOnce(error500)
      
      try {
        await productService.getRecommendations()
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toEqual('Server Error')
      }
    })
  })

  describe('getSimilarProducts', () => {
    it('should call GET similar products', async () => {
      const mockResponse = { data: [] }
      api.get.mockResolvedValueOnce(mockResponse)

      await productService.getSimilarProducts(12, 4)

      expect(api.get).toHaveBeenCalledWith('/api/v1/product/12/similar', { params: { limit: 4 } })
    })
  })
})
