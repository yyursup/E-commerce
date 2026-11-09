import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { exportAdminSettlementCsv } from '../../utils/exportAdminSettlementReport'

// Columns of each order row, in export order.
const COL = { stt: 0, code: 1, shop: 3, shopPhone: 4, buyer: 5, address: 7, payment: 8, ghn: 9, subtotal: 10, shipping: 11, shopDiscount: 12, platformDiscount: 13, buyerPaid: 14, carrier: 15, sellerNet: 16, grossFee: 17, platformNet: 18, status: 19, settlement: 20, note: 21 }

const cells = (line) => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'))

let blob
let link

async function exportCsv(args) {
  exportAdminSettlementCsv(args)
  const text = await blob.text()
  const lines = text.split('\r\n')
  const headerIdx = lines.findIndex((l) => l.startsWith('"STT"'))
  return { text, rows: lines.slice(headerIdx + 1, -1).map(cells), total: cells(lines.at(-1)) }
}

// A normal paid order: 1M goods, 30k shipping, 100k shop voucher, 50k platform voucher, 5% fee on 900k.
const paidOrder = (overrides = {}) => ({
  id: 1,
  status: 'COMPLETED',
  subtotal: 1_000_000,
  shippingFee: 30_000,
  shopDiscountAmount: 100_000,
  platformDiscountAmount: 50_000,
  total: 880_000,
  platformCommission: 45_000,
  ...overrides,
})

describe('exportAdminSettlementCsv', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
      blob = b
      return 'blob:mock'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      link = this
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('refuses to export an empty period', () => {
    expect(() => exportAdminSettlementCsv({ orders: [] })).toThrow('Không có đơn hàng')
  })

  it('downloads a platform-wide CSV with a BOM', async () => {
    await exportCsv({ orders: [paidOrder()], filterRangeLabel: 'Tháng 11' })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(link.getAttribute('download')).toMatch(/^Bao_Cao_Doi_Soat_Toan_San_\d{4}-\d{2}-\d{2}\.csv$/)
    expect(await blob.text()).toContain('Kỳ Hạch Toán: Tháng 11')
  })

  it('splits what the buyer paid between carrier, seller and platform', async () => {
    const { rows } = await exportCsv({ orders: [paidOrder()] })
    const r = rows[0]
    expect(r[COL.carrier]).toBe('30000')
    expect(r[COL.sellerNet]).toBe('855000') // 1M - 100k shop voucher - 45k fee
    expect(r[COL.grossFee]).toBe('45000')
    expect(r[COL.platformNet]).toBe('-5000') // fee minus the 50k platform voucher it funded
    const split = Number(r[COL.carrier]) + Number(r[COL.sellerNet]) + Number(r[COL.platformNet])
    expect(split).toBe(Number(r[COL.buyerPaid]))
  })

  it('reports a balanced book when every order adds up', async () => {
    const { text } = await exportCsv({ orders: [paidOrder(), paidOrder({ id: 2, platformDiscountAmount: 0, total: 930_000 })] })
    expect(text).toContain('Kiểm Tra Cân Đối: CÂN ĐỐI 100%')
  })

  it('flags the book when payouts do not add up to what buyers paid', async () => {
    const { text } = await exportCsv({ orders: [paidOrder({ total: 999_999 })] })
    expect(text).not.toContain('CÂN ĐỐI 100%')
    expect(text).toContain('Kiểm Tra Cân Đối: ĐÃ ĐỐI SOÁT VỚI TRỢ GIÁ VOUCHER')
  })

  it('pays nobody on a cancelled order, not even the carrier', async () => {
    const { rows } = await exportCsv({ orders: [paidOrder({ status: 'CANCELLED' })] })
    expect(rows[0][COL.carrier]).toBe('0')
    expect(rows[0][COL.sellerNet]).toBe('0')
    expect(rows[0][COL.platformNet]).toBe('0')
    expect(rows[0][COL.settlement]).toBe('Đã hủy đơn')
  })

  it('keeps the carrier fee but pays seller and platform nothing on a refund', async () => {
    const { rows } = await exportCsv({ orders: [paidOrder({ status: 'REFUNDED' })] })
    expect(rows[0][COL.carrier]).toBe('30000')
    expect(rows[0][COL.sellerNet]).toBe('0')
    expect(rows[0][COL.platformNet]).toBe('0')
  })

  it('prefers the backend breakdown when present', async () => {
    const { rows } = await exportCsv({
      orders: [paidOrder({
        settlementBreakdown: { carrierSettlement: 1, sellerNetIncome: 2, platformGrossFee: 3, platformNetRevenue: 4, settlementStatusLabel: 'OK' },
      })],
    })
    expect(rows[0].slice(COL.carrier, COL.platformNet + 1)).toEqual(['1', '2', '3', '4'])
    expect(rows[0][COL.settlement]).toBe('OK')
  })

  it('shows the shop and falls back when the shop name is missing', async () => {
    const { rows } = await exportCsv({ orders: [paidOrder({ shopName: 'Sao Mai', shopPhone: '0901' }), paidOrder({ id: 2 })] })
    expect(rows[0][COL.shop]).toBe('Sao Mai')
    expect(rows[0][COL.shopPhone]).toBe('0901')
    expect(rows[1][COL.shop]).toBe('Chưa cập nhật')
    expect(rows[1][COL.ghn]).toBe('Chưa tạo')
  })

  it('labels a fully settled order for the platform', async () => {
    const { rows } = await exportCsv({ orders: [paidOrder()] })
    expect(rows[0][COL.settlement]).toBe('Đã tất toán toàn bộ')
  })

  it('adds a total row whose sums match the order rows', async () => {
    const orders = [paidOrder(), paidOrder({ id: 2, status: 'CANCELLED' }), paidOrder({ id: 3, status: 'REFUNDED' })]
    const { rows, total } = await exportCsv({ orders })
    const sum = (col) => rows.reduce((s, r) => s + Number(r[col]), 0)

    expect(total[0]).toBe('TỔNG CỘNG HẠCH TOÁN')
    expect(total[1]).toBe('3 đơn')
    expect(total).toHaveLength(rows[0].length)
    for (const col of [COL.subtotal, COL.shipping, COL.buyerPaid, COL.carrier, COL.sellerNet, COL.grossFee, COL.platformNet]) {
      expect(Number(total[col])).toBe(sum(col))
    }
  })
})
