import { describe, it, expect } from 'vitest'
import { buildMyOrdersCsv } from '../../utils/exportMyOrdersReport'

const cells = (line) => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'))

const order = (o = {}) => ({
  id: 'a', orderNumber: 'ORD1', status: 'COMPLETED', shopName: 'Shop "A"',
  subtotal: 1000000, shippingFee: 30000, shopDiscountAmount: 100000, platformDiscountAmount: 50000, total: 880000,
  items: [{ productName: 'iPhone', quantity: 2 }], ...o,
})

describe('buildMyOrdersCsv', () => {
  it('ném lỗi khi không có đơn', () => {
    expect(() => buildMyOrdersCsv([])).toThrow()
  })

  it('xuất từng đơn, escape dấu ngoặc kép và cộng tổng', () => {
    const csv = buildMyOrdersCsv([order(), order({ id: 'b', orderNumber: 'ORD2', status: 'CANCELLED', total: 500000 })])
    const lines = csv.split('\r\n')
    expect(csv.startsWith('﻿')).toBe(true)
    const hdr = lines.findIndex((l) => l.startsWith('"STT"'))
    const row = cells(lines[hdr + 1])
    expect(row[1]).toBe('ORD1')
    expect(row[3]).toBe('Shop "A"')
    expect(row[4]).toBe('iPhone x2')
    const total = cells(lines.at(-1))
    expect(total[1]).toBe('2 đơn')
    expect(total[9]).toBe('1380000')
    // đơn hủy không tính vào "đã chi"
    expect(cells(lines[3])[1]).toBe('880000')
  })
})
