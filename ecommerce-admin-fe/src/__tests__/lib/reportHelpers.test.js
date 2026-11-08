import { describe, it, expect } from 'vitest'
import { isSellerReturnDisputeItem } from '../../lib/reportHelpers'

describe('isSellerReturnDisputeItem', () => {
  it('returns false for a missing or ordinary report', () => {
    expect(isSellerReturnDisputeItem(null)).toBe(false)
    expect(isSellerReturnDisputeItem({ description: 'Sản phẩm giả', targetInfo: 'PRODUCT #1' })).toBe(false)
  })

  it('trusts the explicit flag from the backend', () => {
    expect(isSellerReturnDisputeItem({ isSellerReturnDispute: true })).toBe(true)
  })

  it('detects a DISPUTED return on the item, its orderReturn, or the nested detail', () => {
    expect(isSellerReturnDisputeItem({ orderReturnStatus: 'DISPUTED' })).toBe(true)
    expect(isSellerReturnDisputeItem({ orderReturn: { status: 'DISPUTED' } })).toBe(true)
    expect(isSellerReturnDisputeItem({ detail: { orderReturn: { status: 'DISPUTED' } } })).toBe(true)
  })

  it('treats any recorded inspection result as a return dispute', () => {
    expect(isSellerReturnDisputeItem({ conditionStatus: 'DAMAGED' })).toBe(true)
    expect(isSellerReturnDisputeItem({ orderReturn: { conditionStatus: 'EMPTY_BOX' } })).toBe(true)
  })

  it('falls back to keywords in targetInfo, escalationReason and description', () => {
    expect(isSellerReturnDisputeItem({ targetInfo: 'ORDER_RETURN DISPUTED' })).toBe(true)
    expect(isSellerReturnDisputeItem({ detail: { targetInfo: 'DISPUTED' } })).toBe(true)
    expect(isSellerReturnDisputeItem({ escalationReason: 'Shop báo kiện hàng hoàn bị tráo' })).toBe(true)
    expect(isSellerReturnDisputeItem({ detail: { escalationReason: 'kiện hàng hoàn thiếu phụ kiện' } })).toBe(true)
    expect(isSellerReturnDisputeItem({ description: 'Shop khiếu nại đơn hoàn' })).toBe(true)
    expect(isSellerReturnDisputeItem({ detail: { description: 'Shop khiếu nại' } })).toBe(true)
  })

  it('does not match an orderReturn that is merely in progress', () => {
    expect(isSellerReturnDisputeItem({ orderReturn: { status: 'SHIPPED' } })).toBe(false)
  })
})
