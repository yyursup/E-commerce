import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { exportSellerSettlementCsv } from '../../utils/exportSettlementReport'

// Columns of each order row, in export order.
const COL = { stt: 0, code: 1, buyer: 3, phone: 4, address: 5, payment: 6, ghn: 7, subtotal: 8, shipping: 9, shopDiscount: 10, platformDiscount: 11, buyerPaid: 12, commissionBase: 13, rate: 14, commission: 15, net: 16, status: 17, settlement: 18, note: 19 }

// Splits one CSV line made of "quoted" cells (quotes inside cells are doubled).
const cells = (line) => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'))

let blob
let link

async function exportCsv(args) {
  exportSellerSettlementCsv(args)
  const text = await blob.text()
  const lines = text.split('\r\n')
  const headerIdx = lines.findIndex((l) => l.startsWith('"STT"'))
  return {
    text,
    lines,
    rows: lines.slice(headerIdx + 1, -1).map(cells),
    total: cells(lines.at(-1)),
  }
}

describe('exportSellerSettlementCsv', () => {
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
    expect(() => exportSellerSettlementCsv({ orders: [] })).toThrow('Không có đơn hàng')
    expect(() => exportSellerSettlementCsv({ orders: null })).toThrow()
  })

  it('downloads a UTF-8 CSV with a BOM so Excel shows Vietnamese correctly', async () => {
    const { text } = await exportCsv({ orders: [{ id: 1, status: 'COMPLETED' }], shopName: 'Sao Mai' })
    expect(blob.type).toBe('text/csv;charset=utf-8;')
    // Blob#text() strips the BOM when decoding, so check the raw bytes.
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(text).toContain('Tên Gian Hàng: Sao Mai')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('names the file after the shop, replacing unsafe characters', async () => {
    await exportCsv({ orders: [{ id: 1 }], shopName: 'Sao Mai/Store' })
    expect(link.getAttribute('download')).toMatch(/^Bao_Cao_Doi_Soat_Sao_Mai_Store_\d{4}-\d{2}-\d{2}\.csv$/)
    expect(document.body.contains(link)).toBe(false) // temporary link is removed again
  })

  it('computes commission base and seller income when the backend sends no breakdown', async () => {
    const { rows } = await exportCsv({
      orders: [{ id: 1, status: 'COMPLETED', subtotal: 1_000_000, shippingFee: 30_000, shopDiscountAmount: 100_000, total: 930_000, platformCommission: 45_000 }],
    })
    const r = rows[0]
    expect(r[COL.commissionBase]).toBe('900000') // subtotal - shop voucher
    expect(r[COL.net]).toBe('855000') // subtotal - shop voucher - commission
    expect(r[COL.rate]).toBe('4.5%') // 45k / 1M
    expect(r[COL.settlement]).toBe('Đã giải ngân ví shop')
  })

  it('prefers the backend settlement breakdown over local estimates', async () => {
    const { rows } = await exportCsv({
      orders: [{
        id: 1,
        subtotal: 1,
        settlementBreakdown: {
          merchandiseSubtotal: 500_000,
          commissionBaseAmount: 480_000,
          commissionRate: 5,
          platformCommissionFee: 24_000,
          sellerNetIncome: 456_000,
          settlementStatusLabel: 'Đã đối soát',
          payoutNote: 'Chuyển khoản 09/11',
        },
      }],
    })
    const r = rows[0]
    expect(r[COL.subtotal]).toBe('500000')
    expect(r[COL.rate]).toBe('5%')
    expect(r[COL.net]).toBe('456000')
    expect(r[COL.settlement]).toBe('Đã đối soát')
    expect(r[COL.note]).toBe('Chuyển khoản 09/11')
  })

  it.each([
    [{ status: 'CANCELLED' }, 'Đã hủy đơn'],
    [{ status: 'REFUNDED' }, 'Đã hoàn trả 100%'],
    [{ status: 'DELIVERED', returnInfo: { status: 'COMPLETED' } }, 'Đã hoàn trả 100%'],
  ])('pays the seller nothing for %o', async (order, label) => {
    const { rows } = await exportCsv({ orders: [{ id: 1, subtotal: 100_000, ...order }] })
    expect(rows[0][COL.net]).toBe('0')
    expect(rows[0][COL.settlement]).toBe(label)
  })

  it.each([
    [{ status: 'DELIVERED', hasActiveDispute: true }, 'Đóng băng đối soát'],
    [{ status: 'DELIVERED' }, 'Trong 72h trải nghiệm'],
    [{ status: 'SHIPPING' }, 'Tạm giữ Escrow'],
  ])('labels the settlement stage for %o', async (order, label) => {
    const { rows } = await exportCsv({ orders: [{ id: 1, ...order }] })
    expect(rows[0][COL.settlement]).toBe(label)
  })

  it('never reports negative seller income', async () => {
    const { rows } = await exportCsv({ orders: [{ id: 1, status: 'COMPLETED', subtotal: 10_000, platformCommission: 50_000 }] })
    expect(rows[0][COL.net]).toBe('0')
  })

  it('labels payment methods, missing tracking codes and joins the address', async () => {
    const { rows } = await exportCsv({
      orders: [
        { id: 1, paymentMethod: 'VNPAY', shippingAddress: '1 Lê Lợi', shippingWard: 'Bến Nghé', shippingCity: 'TP.HCM' },
        { id: 2, paymentMethod: 'WALLET', ghnOrderCode: 'GHN123' },
      ],
    })
    expect(rows[0][COL.payment]).toBe('VNPAY')
    expect(rows[0][COL.ghn]).toBe('Chưa tạo vận đơn')
    expect(rows[0][COL.address]).toBe('1 Lê Lợi, Bến Nghé, TP.HCM')
    expect(rows[1][COL.payment]).toBe('Ví sàn')
    expect(rows[1][COL.ghn]).toBe('GHN123')
  })

  it('escapes quotes and commas so a buyer name cannot break the columns', async () => {
    const { rows } = await exportCsv({ orders: [{ id: 1, shippingName: 'Anh "Tuấn", Q1' }] })
    expect(rows[0]).toHaveLength(20)
    expect(rows[0][COL.buyer]).toBe('Anh "Tuấn", Q1')
  })

  it('adds a total row whose sums match the order rows', async () => {
    const orders = [
      { id: 1, status: 'COMPLETED', subtotal: 200_000, shippingFee: 20_000, total: 220_000, platformCommission: 10_000 },
      { id: 2, status: 'COMPLETED', subtotal: 300_000, shippingFee: 25_000, total: 325_000, platformCommission: 15_000 },
      { id: 3, status: 'CANCELLED', subtotal: 50_000, total: 50_000 },
    ]
    const { rows, total } = await exportCsv({ orders })
    const sum = (col) => rows.reduce((s, r) => s + Number(r[col]), 0)

    expect(rows.map((r) => r[COL.stt])).toEqual(['1', '2', '3'])
    expect(total[0]).toBe('TỔNG CỘNG')
    expect(total[1]).toBe('3 đơn')
    for (const col of [COL.subtotal, COL.shipping, COL.buyerPaid, COL.commission, COL.net]) {
      expect(Number(total[col])).toBe(sum(col))
    }
    expect(total[COL.net]).toBe('475000') // 190k + 285k, cancelled order pays nothing
  })
})
