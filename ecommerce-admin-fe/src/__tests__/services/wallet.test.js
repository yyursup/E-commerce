import { describe, it, expect, vi, beforeEach } from 'vitest'
import walletService from '../../services/wallet'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service ví và rút tiền: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getMyWallet", [], "get", ["/api/v1/wallet/me"]],
  ["getAdminWallet", ["username-value"], "get", ["/api/v1/wallet/admin", {"params": {"userName": "username-value"}}]],
  ["adminGetWithdrawals", [{"sample": "params-value"}], "get", ["/api/v1/wallet/admin/withdrawals", {"params": {"sample": "params-value"}}]],
  ["adminApproveWithdrawal", ["id-1", {"sample": "data-value"}], "post", ["/api/v1/wallet/admin/withdrawals/id-1/approve", {"sample": "data-value"}]],
  ["adminRejectWithdrawal", ["id-1", {"sample": "data-value"}], "post", ["/api/v1/wallet/admin/withdrawals/id-1/reject", {"sample": "data-value"}]],
]

describe('walletService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(walletService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(walletService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(walletService[method](...args)).rejects.toBe(networkError)
  })
})
