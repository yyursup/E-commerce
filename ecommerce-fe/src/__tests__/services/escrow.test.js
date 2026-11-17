import { describe, it, expect, vi, beforeEach } from 'vitest'
import escrowService from '../../services/escrow'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service ký quỹ: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getAdminEscrows", [{"sample": "params-value"}], "get", ["/api/v1/escrow", {"params": {"sample": "params-value"}}]],
  ["releaseByOrder", ["orderid-1"], "post", ["/api/v1/escrow/orders/orderid-1/release"]],
  ["getSettlementByOrderId", ["orderid-1"], "get", ["/api/v1/escrow/orders/orderid-1/settlement"]],
]

describe('escrowService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(escrowService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(escrowService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(escrowService[method](...args)).rejects.toBe(networkError)
  })
})
