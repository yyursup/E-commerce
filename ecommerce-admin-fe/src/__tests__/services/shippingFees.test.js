import { describe, it, expect, vi, beforeEach } from 'vitest'
import shippingFeeService from '../../services/shippingFees'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const CASES = [
  ['list', [{ direction: 'RETURN', page: 0, size: 10 }], ['/api/v1/shipping-fees', { params: { direction: 'RETURN', page: 0, size: 10 } }]],
  ['summary', [], ['/api/v1/shipping-fees/summary']],
]

describe('shippingFeeService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, expected) => {
    axiosClient.get.mockResolvedValueOnce({ data: { ok: true } })

    await expect(shippingFeeService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient.get).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args) => {
    axiosClient.get.mockRejectedValueOnce({ response: { data: { message: 'Lỗi' } } })

    await expect(shippingFeeService[method](...args)).rejects.toEqual({ message: 'Lỗi' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args) => {
    const networkError = new Error('Network Error')
    axiosClient.get.mockRejectedValueOnce(networkError)

    await expect(shippingFeeService[method](...args)).rejects.toBe(networkError)
  })
})
