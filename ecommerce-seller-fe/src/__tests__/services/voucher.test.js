import { describe, it, expect, vi, beforeEach } from 'vitest'
import voucherService from '../../services/voucher'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service voucher: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getShopManageVouchers", [], "get", ["/api/v1/vouchers/shop-manage"]],
  ["createVoucher", [{"sample": "payload-value"}], "post", ["/api/v1/vouchers", {"sample": "payload-value", "scope": "SHOP"}]],
  ["updateVoucher", ["id-1", {"sample": "payload-value"}], "put", ["/api/v1/vouchers/id-1", {"sample": "payload-value"}]],
  ["deleteVoucher", ["id-1"], "delete", ["/api/v1/vouchers/id-1"]],
]

describe('voucherService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(voucherService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(voucherService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(voucherService[method](...args)).rejects.toBe(networkError)
  })
})
