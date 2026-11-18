import { describe, it, expect } from 'vitest'
import {
  DIRECTION_OPTIONS,
  createdByLabel,
  directionLabel,
  formatVnd,
  payerLabel,
} from '../../pages/admin/components/finances/shippingFeeHelpers'

describe('shippingFeeHelpers', () => {
  it('formatVnd định dạng tiền Việt và coi giá trị rỗng là 0', () => {
    expect(formatVnd(30000)).toContain('30.000')
    expect(formatVnd(null)).toContain('0')
    expect(formatVnd(undefined)).toContain('0')
  })

  it('directionLabel phân biệt chiều đi và chiều về', () => {
    expect(directionLabel('OUTBOUND')).toBe('Chiều đi')
    expect(directionLabel('RETURN')).toBe('Chiều về')
  })

  it('createdByLabel cho biết ai tạo đơn GHN', () => {
    expect(createdByLabel('SHOP')).toBe('Shop tạo đơn')
    expect(createdByLabel('BUYER')).toBe('Người mua tạo đơn')
  })

  it('payerLabel: chiều đi do người mua trả, chiều về trích quỹ ký quỹ shop', () => {
    expect(payerLabel({ payer: 'BUYER' })).toBe('Người mua đã trả')
    expect(payerLabel({ payer: 'SHOP_FUND', deductedFromShopFund: true })).toBe('Đã trích quỹ ký quỹ shop')
    expect(payerLabel({ payer: 'SHOP_FUND', deductedFromShopFund: false })).toContain('chờ phán quyết')
    expect(payerLabel(null)).toBe('Người mua đã trả')
  })

  it('DIRECTION_OPTIONS có lựa chọn cả hai chiều với giá trị rỗng', () => {
    expect(DIRECTION_OPTIONS[0].value).toBe('')
    expect(DIRECTION_OPTIONS.map((o) => o.value)).toEqual(['', 'OUTBOUND', 'RETURN'])
  })
})
