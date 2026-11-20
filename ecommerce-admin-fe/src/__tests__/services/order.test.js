import { describe, it, expect, vi, beforeEach } from 'vitest'
import orderService from '../../services/order'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// Service đơn hàng: mỗi dòng là [hàm, tham số, phương thức HTTP, tham số axios mong đợi].
// Các endpoint này đã được đối chiếu với route của backend (Spring controller) khi viết test.
const CASES = [
  ["getCheckoutConfirm", ["shopid-1"], "get", ["/api/v1/checkout/confirm", {"params": {"shopId": "shopid-1"}}]],
  ["createOrder", ["shopid-1", "addressid-1", "notes-1"], "post", ["/api/v1/order", {"shopId": "shopid-1", "addressId": "addressid-1", "notes": "notes-1"}]],
  ["getMyOrderById", ["orderid-1"], "get", ["/api/v1/order/orderid-1/me"]],
  ["getMyOrders", ["DELIVERED"], "get", ["/api/v1/order/me", {"params": {"status": "DELIVERED"}}]],
  ["getShopOrderById", ["orderid-1"], "get", ["/api/v1/order/shops/orders/orderid-1"]],
  ["getShopOrders", ["DELIVERED"], "get", ["/api/v1/order/shops", {"params": {"status": "DELIVERED"}}]],
  ["getOrderById", ["orderid-1"], "get", ["/api/v1/order/orderid-1"]],
  ["getAllOrders", ["DELIVERED", "shopid-1"], "get", ["/api/v1/order", {"params": {"status": "DELIVERED", "shopId": "shopid-1"}}]],
  ["getShopRanking", [], "get", ["/api/v1/order/shop-ranking"]],
  ["createPayment", ["orderid-1"], "post", ["/api/v1/payment/orders/orderid-1/vnpay"]],
  ["verifyVnpayPayment", [{"sample": "params-value"}], "get", ["/api/v1/payment/vnpay/return", {"params": {"sample": "params-value"}}]],
  ["markOrderReceived", ["orderid-1"], "patch", ["/api/v1/order/orderid-1/received"]],
  ["updateOrderStatus", ["orderid-1", "DELIVERED"], "patch", ["/api/v1/order/orderid-1/status", null, {"params": {"status": "DELIVERED"}}]],
  ["retryCreateGhnOrder", ["orderid-1"], "post", ["/api/v1/order/orderid-1/ghn/retry"]],
  ["setGhnOrderCode", ["orderid-1", "ghnordercode-value"], "put", ["/api/v1/order/orderid-1/ghn/code", null, {"params": {"ghnOrderCode": "ghnordercode-value"}}]],
]

describe('orderService', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(CASES)('%s gọi đúng endpoint và trả về response.data', async (method, args, verb, expected) => {
    axiosClient[verb].mockResolvedValueOnce({ data: { ok: true } })

    await expect(orderService[method](...args)).resolves.toEqual({ ok: true })

    expect(axiosClient[verb]).toHaveBeenCalledTimes(1)
    expect(axiosClient[verb]).toHaveBeenCalledWith(...expected)
  })

  it.each(CASES)('%s ném lại nội dung lỗi từ server', async (method, args, verb) => {
    axiosClient[verb].mockRejectedValueOnce({ response: { data: { message: 'Lỗi nghiệp vụ' } } })

    await expect(orderService[method](...args)).rejects.toEqual({ message: 'Lỗi nghiệp vụ' })
  })

  it.each(CASES)('%s ném nguyên lỗi mạng khi không có phản hồi', async (method, args, verb) => {
    const networkError = new Error('Network Error')
    axiosClient[verb].mockRejectedValueOnce(networkError)

    await expect(orderService[method](...args)).rejects.toBe(networkError)
  })
})
