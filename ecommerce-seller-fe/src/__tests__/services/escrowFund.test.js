import { describe, it, expect, vi, beforeEach } from 'vitest'
import escrowFundService from '../../services/escrowFund'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service quỹ ký quỹ của shop: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getMyFund", [], "get", ["/api/v1/shop-escrow-fund/my-fund"]],
  ["getMyTransactions", [{"sample": "params-value"}], "get", ["/api/v1/shop-escrow-fund/my-fund/transactions", {"params": {"sample": "params-value"}}]],
  ["topUpFund", [{"sample": "payload-value"}], "post", ["/api/v1/shop-escrow-fund/top-up", {"sample": "payload-value"}]],
  ["createVnpayPayment", [{"sample": "payload-value"}], "post", ["/api/v1/shop-escrow-fund/vnpay/create-payment", {"sample": "payload-value"}]],
  ["requestCloseShopRefund", [], "post", ["/api/v1/shop-escrow-fund/request-refund"]],
  ["getTrustLevels", [], "get", ["/api/v1/trust-levels"]],
]

describe('escrowFundService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(escrowFundService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(escrowFundService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(escrowFundService[method](...args)).rejects.toBe(networkError)
  })
})
