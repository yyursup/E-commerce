import { describe, it, expect, vi, beforeEach } from 'vitest'
import sellerService from '../../services/seller'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe('sellerService – sản phẩm phân trang', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getProductsByShop gửi page/size/status/q đã trim', async () => {
    axiosClient.get.mockResolvedValueOnce({ data: { content: [] } })
    await sellerService.getProductsByShop({ page: 2, size: 10, status: 'PUBLISHED', q: '  iphone ' })
    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/seller/by-shop', {
      params: { page: 2, size: 10, status: 'PUBLISHED', q: 'iphone' },
    })
  })

  it('getProductsByShop bỏ status/q rỗng', async () => {
    axiosClient.get.mockResolvedValueOnce({ data: {} })
    await sellerService.getProductsByShop({ status: null, q: '  ' })
    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/seller/by-shop', { params: { page: 0, size: 10 } })
  })

  it('getFeaturedCount gọi đúng endpoint', async () => {
    axiosClient.get.mockResolvedValueOnce({ data: 3 })
    await expect(sellerService.getFeaturedCount()).resolves.toBe(3)
    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/seller/by-shop/featured-count')
  })
})
