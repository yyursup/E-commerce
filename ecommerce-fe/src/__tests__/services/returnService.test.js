import { describe, it, expect, vi, beforeEach } from 'vitest'
import returnService from '../../services/returnService'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service đổi trả: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getReturnByOrderId", ["orderid-1"], "get", ["/api/v1/returns/order/orderid-1"]],
  ["getReturnDetails", ["returnid-1"], "get", ["/api/v1/returns/returnid-1"]],
  ["submitTracking", [{"sample": "returnidorpayload-value"}, {"sample": "payload-value"}], "post", ["/api/v1/returns/undefined/tracking", {"sample": "returnidorpayload-value"}]],
  ["confirmDelivered", ["returnid-1"], "post", ["/api/v1/returns/returnid-1/confirm-delivered"]],
  ["confirmReturned", ["returnid-1"], "post", ["/api/v1/returns/returnid-1/confirm-returned"]],
  ["completeReturn", [{"sample": "returnidorpayload-value"}, {"sample": "payload-value"}], "post", ["/api/v1/returns/undefined/complete", {"sample": "returnidorpayload-value"}]],
  ["disputeReturn", [{"sample": "returnidorpayload-value"}, {"sample": "payload-value"}], "post", ["/api/v1/returns/undefined/dispute", {"sample": "returnidorpayload-value"}]],
  ["resolveDispute", [{"sample": "returnidorpayload-value"}, {"sample": "payload-value"}], "post", ["/api/v1/returns/undefined/resolve-dispute", {"sample": "returnidorpayload-value"}]],
]

describe('returnService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(returnService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(returnService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(returnService[method](...args)).rejects.toBe(networkError)
  })
})
