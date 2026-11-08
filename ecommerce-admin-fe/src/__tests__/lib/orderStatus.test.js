import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL_MAP,
  ORDER_STATUS_BADGE_MAP,
  RETURN_STATUS_LABEL_MAP,
  getOrderStatusBadge,
  getOrderStatusLabel,
  getReturnStatusBadge,
  getReturnStatusLabel,
  getReturnStatusDisplay,
  getOrderEffectiveStatus,
  formatOrderCurrency,
  formatOrderDate,
} from '../../lib/orderStatus'

describe('orderStatus (admin)', () => {
  describe('order status maps', () => {
    it('has a label and a badge for every order status', () => {
      for (const status of Object.keys(ORDER_STATUS_LABEL_MAP)) {
        expect(getOrderStatusLabel(status)).toBe(ORDER_STATUS_LABEL_MAP[status])
        expect(getOrderStatusBadge(status)).toHaveProperty('color')
      }
    })

    it('exposes ORDER_STATUSES as a non-empty list', () => {
      expect(Array.isArray(ORDER_STATUSES)).toBe(true)
      expect(ORDER_STATUSES.length).toBeGreaterThan(0)
    })

    it('falls back to the raw status and a neutral badge for unknown values', () => {
      expect(getOrderStatusLabel('MYSTERY')).toBe('MYSTERY')
      const badge = getOrderStatusBadge('MYSTERY')
      expect(badge.color).toContain('bg-gray-100')
      expect(badge.icon).toBeDefined()
      expect(ORDER_STATUS_BADGE_MAP.MYSTERY).toBeUndefined()
    })
  })

  describe('return status helpers', () => {
    it('labels every return status', () => {
      for (const status of Object.keys(RETURN_STATUS_LABEL_MAP)) {
        expect(getReturnStatusLabel(status)).toBe(RETURN_STATUS_LABEL_MAP[status])
        expect(getReturnStatusBadge(status)).toBeTruthy()
      }
    })

    it('returns null display for a missing or unknown return status', () => {
      expect(getReturnStatusDisplay(null)).toBeNull()
      expect(getReturnStatusDisplay('NOPE')).toBeNull()
    })
  })

  describe('getOrderEffectiveStatus', () => {
    it('shows a plain order status when there is no return', () => {
      const s = getOrderEffectiveStatus({ status: 'SHIPPING' })
      expect(s.label).toBe(ORDER_STATUS_LABEL_MAP.SHIPPING)
      expect(s.isReturn).toBe(false)
    })

    it('lets a finished order win over an open dispute', () => {
      const completed = getOrderEffectiveStatus({ status: 'COMPLETED', returnInfo: { status: 'DISPUTED' } })
      expect(completed.label).toBe(ORDER_STATUS_LABEL_MAP.COMPLETED)
      expect(completed.isReturn).toBe(false)
    })

    it('labels a refunded order with or without a return', () => {
      expect(getOrderEffectiveStatus({ status: 'REFUNDED' }).label).toBe('Đã hoàn tiền')
      const withReturn = getOrderEffectiveStatus({ status: 'REFUNDED', returnInfo: { status: 'COMPLETED' } })
      expect(withReturn.label).toBe('Đã hoàn tất đổi trả & Hoàn tiền')
      expect(withReturn.isReturn).toBe(true)
    })

    it('ignores a cancelled return', () => {
      const s = getOrderEffectiveStatus({ status: 'DELIVERED', returnInfo: { status: 'CANCELLED' } })
      expect(s.label).toBe(ORDER_STATUS_LABEL_MAP.DELIVERED)
      expect(s.isReturn).toBe(false)
    })

    it('shows the return status while a return is in progress', () => {
      const s = getOrderEffectiveStatus({ status: 'DELIVERED' }, { status: 'DISPUTED' })
      expect(s.label).toBe(RETURN_STATUS_LABEL_MAP.DISPUTED)
      expect(s.isReturn).toBe(true)
    })

    it('shows the generic completed-return label, whatever the settlement type', () => {
      // Unlike the seller app, admin does not spell out the split on the badge.
      const s = getOrderEffectiveStatus({
        status: 'DELIVERED',
        returnInfo: { status: 'COMPLETED', settlement: { settlementType: 'PARTIAL_SPLIT', buyerPercentage: 30, sellerPercentage: 70 } },
      })
      expect(s.label).toBe(getReturnStatusDisplay('COMPLETED').label)
    })

    it('labels an order without a status as unknown', () => {
      expect(getOrderEffectiveStatus({}).label).toBe('Không xác định')
    })


    it('accepts a whole order object in getOrderStatusLabel / getOrderStatusBadge', () => {
      const order = { status: 'DELIVERED', returnInfo: { status: 'DISPUTED' } }
      expect(getOrderStatusLabel(order)).toBe(RETURN_STATUS_LABEL_MAP.DISPUTED)
      expect(getOrderStatusBadge(order).isReturn).toBe(true)
    })

    it('copes with a missing order', () => {
      expect(() => getOrderEffectiveStatus(undefined)).not.toThrow()
    })
  })

  describe('formatters', () => {
    it('formats VND and treats junk as zero', () => {
      expect(formatOrderCurrency(1500000)).toMatch(/1\.500\.000/)
      expect(formatOrderCurrency(1500000)).toContain('₫')
      expect(formatOrderCurrency('abc')).toMatch(/^0/)
    })

    it('formats dates and returns an empty string for missing ones', () => {
      expect(formatOrderDate(null)).toBe('')
      expect(formatOrderDate('2026-11-08T10:30:00')).toContain('2026')
    })
  })
})
