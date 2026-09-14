import { describe, it, expect, vi, beforeEach } from 'vitest'
import socialService from '../../services/social'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('socialService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toggleFollowShop', () => {
    it('should toggle shop follow and return status and count', async () => {
      const mockResponse = { data: { following: true, followerCount: 150 } }
      axiosClient.post.mockResolvedValueOnce(mockResponse)

      const result = await socialService.toggleFollowShop('shop-123')

      expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/social/shop/toggle-follow/shop-123')
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error response data on failure', async () => {
      const errorResponse = { response: { data: { message: 'Shop not found' } } }
      axiosClient.post.mockRejectedValueOnce(errorResponse)

      try {
        await socialService.toggleFollowShop('shop-invalid')
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toEqual(errorResponse.response.data)
      }
    })
  })

  describe('getFollowStatus', () => {
    it('should get follow status and follower count', async () => {
      const mockResponse = { data: { following: false, followerCount: 42 } }
      axiosClient.get.mockResolvedValueOnce(mockResponse)

      const result = await socialService.getFollowStatus('shop-456')

      expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/social/shop/follow-status/shop-456')
      expect(result).toEqual(mockResponse.data)
    })
  })
})
