import { describe, it, expect, vi } from 'vitest'

vi.mock('../../services/order', () => ({ default: {} }))
const { buildOrderStats } = await import('../../pages/business/ShopOrders')

describe('buildOrderStats', () => {
  it('gộp số đếm theo nhóm tab và doanh thu đã giao từ thống kê server', () => {
    const { metrics, tabs } = buildOrderStats([
      { status: 'PENDING', count: 1, total: 100 },
      { status: 'CONFIRMED', count: 2, total: 200 },
      { status: 'SHIPPED', count: 3, total: 300 },
      { status: 'DELIVERED', count: 4, total: 400 },
      { status: 'COMPLETED', count: 5, total: 500 },
      { status: 'REFUNDED', count: 6, total: 600 },
    ])
    const byId = Object.fromEntries(tabs.map((t) => [t.id, t.count]))
    expect(byId).toEqual({ ALL: 21, PENDING_PAYMENT: 0, PROCESSING: 3, SHIPPING: 3, DELIVERED: 9, CANCELLED: 6 })
    expect(metrics.pendingProcessingCount).toBe(2)
    expect(metrics.totalDeliveredRevenue).toBe(900)
  })

  it('không có dữ liệu thì mọi số bằng 0', () => {
    expect(buildOrderStats().metrics.totalCount).toBe(0)
  })
})
