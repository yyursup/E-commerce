import { describe, it, expect, vi, beforeEach } from 'vitest'
import trustConfigService from '../../services/trustConfig'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service cấu hình bậc sao và quỹ ký quỹ (admin): mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getAdminTrustLevels", [], "get", ["/api/v1/trust-levels/admin"]],
  ["updateTrustLevel", [50, {"sample": "payload-value"}], "put", ["/api/v1/trust-levels/admin/50", {"sample": "payload-value"}]],
  ["resetDefaultTrustLevels", [], "post", ["/api/v1/trust-levels/admin/reset-defaults"]],
  ["getAdminEscrowFunds", [{"sample": "params-value"}], "get", ["/api/v1/shop-escrow-fund/admin", {"params": {"sample": "params-value"}}]],
  ["getFundByShopId", ["shopid-1"], "get", ["/api/v1/shop-escrow-fund/admin/shop/shopid-1"]],
  ["getFundTransactions", ["fundid-1", {"sample": "params-value"}], "get", ["/api/v1/shop-escrow-fund/admin/fundid-1/transactions", {"params": {"sample": "params-value"}}]],
  ["deductCompensation", ["shopid-1", {"sample": "payload-value"}], "post", ["/api/v1/shop-escrow-fund/admin/shopid-1/deduct", {"sample": "payload-value"}]],
  ["adjustShopFund", ["shopid-1", {"sample": "payload-value"}], "put", ["/api/v1/shop-escrow-fund/admin/shopid-1/adjust", {"sample": "payload-value"}]],
  ["approveCloseShopRefund", ["shopid-1"], "post", ["/api/v1/shop-escrow-fund/admin/shopid-1/approve-close-refund"]],
  ["rejectCloseShopRefund", ["shopid-1", "reason-value"], "post", ["/api/v1/shop-escrow-fund/admin/shopid-1/reject-close-refund", {"reason": "reason-value"}]],
]

describe('trustConfigService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(trustConfigService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(trustConfigService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(trustConfigService[method](...args)).rejects.toBe(networkError)
  })
})
