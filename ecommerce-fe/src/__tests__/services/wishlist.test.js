import { describe, it, expect, vi, beforeEach } from 'vitest'
import wishlistService from '../../services/wishlist'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('wishlistService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toggleWishlist', () => {
    it('should toggle wishlist and return status and count', async () => {
      const mockResponse = { data: { wishlisted: true, wishlistCount: 5 } }
      axiosClient.post.mockResolvedValueOnce(mockResponse)

      const result = await wishlistService.toggleWishlist('prod-123')

      expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/wishlist/toggle/prod-123')
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error response data on failure', async () => {
      const errorResponse = { response: { data: { message: 'Unauthorized' } } }
      axiosClient.post.mockRejectedValueOnce(errorResponse)

      try {
        await wishlistService.toggleWishlist('prod-123')
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toEqual(errorResponse.response.data)
      }
    })
  })

  describe('getWishlistStatus', () => {
    it('should get wishlist status and count', async () => {
      const mockResponse = { data: { wishlisted: false, wishlistCount: 12 } }
      axiosClient.get.mockResolvedValueOnce(mockResponse)

      const result = await wishlistService.getWishlistStatus('prod-456')

      expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/wishlist/status/prod-456')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getMyWishlist', () => {
    it('should fetch user wishlist with page params', async () => {
      const mockResponse = { data: { content: [{ id: 'prod-1', name: 'Item 1' }] } }
      axiosClient.get.mockResolvedValueOnce(mockResponse)

      const result = await wishlistService.getMyWishlist({ page: 0, size: 10 })

      expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/wishlist/my', {
        params: { page: 0, size: 10 },
      })
      expect(result).toEqual(mockResponse.data)
    })
  })
})
