import { describe, it, expect, vi, beforeEach } from 'vitest'
import commissionService from '../../services/commission'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service hoa hồng: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getOverview", [], "get", ["/api/v1/commissions/overview"]],
  ["getByMonth", [], "get", ["/api/v1/commissions/by-month"]],
  ["getByCategory", [], "get", ["/api/v1/commissions/by-category"]],
  ["getTopSellers", [2], "get", ["/api/v1/commissions/top-sellers", {"params": {"limit": 2}}]],
  ["getCommissions", [{"sample": "filter-value"}], "get", ["/api/v1/commissions", {"params": {"sample": "filter-value"}}]],
  ["createCommission", ["orderid-1"], "post", ["/api/v1/commissions/orders/orderid-1"]],
  ["getByOrderId", ["orderid-1"], "get", ["/api/v1/commissions/orders/orderid-1"]],
]

describe('commissionService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(commissionService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(commissionService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(commissionService[method](...args)).rejects.toBe(networkError)
  })
})
