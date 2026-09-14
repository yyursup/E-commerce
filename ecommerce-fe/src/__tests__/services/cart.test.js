import { describe, it, expect, vi, beforeEach } from 'vitest'
import cartService from '../../services/cart'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCart', () => {
    it('should return cart data on success', async () => {
      const mockResponse = { data: { items: [], totalItems: 0 } }
      axiosClient.get.mockResolvedValueOnce(mockResponse)

      const result = await cartService.getCart()

      expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/cart')
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error response data if available', async () => {
      const errorResponse = { response: { data: { message: 'Cart not found' } } }
      axiosClient.get.mockRejectedValueOnce(errorResponse)

      try {
        await cartService.getCart()
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toEqual(errorResponse.response.data)
      }
    })
  })

  describe('addToCart', () => {
    it('should post to items with default quantity', async () => {
      const mockResponse = { data: { success: true } }
      axiosClient.post.mockResolvedValueOnce(mockResponse)

      await cartService.addToCart(123) // default quantity = 1

      expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items', {
        productId: 123,
        quantity: 1
      })
    })

    it('should post to items with specified quantity', async () => {
      axiosClient.post.mockResolvedValueOnce({ data: {} })

      await cartService.addToCart(123, 5)

      expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items', {
        productId: 123,
        quantity: 5
      })
    })
  })

  describe('increaseQuantity and decreaseQuantity', () => {
    it('should call plus endpoint', async () => {
      axiosClient.post.mockResolvedValueOnce({ data: {} })
      await cartService.increaseQuantity(10)
      expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items/10/plus')
    })

    it('should call minus endpoint', async () => {
      axiosClient.post.mockResolvedValueOnce({ data: {} })
      await cartService.decreaseQuantity(20)
      expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items/20/minus')
    })
  })

  describe('removeItem', () => {
    it('should call delete endpoint', async () => {
      axiosClient.delete.mockResolvedValueOnce({ data: {} })
      await cartService.removeItem(99)
      expect(axiosClient.delete).toHaveBeenCalledWith('/api/v1/cart/items/99')
    })
  })
})
