import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_LABEL_MAP,
  getOrderStatusBadge,
  getOrderStatusLabel,
  formatOrderCurrency,
  formatOrderDate,
  ORDER_STATUS_BADGE_MAP
} from '../../lib/orderStatus'

describe('orderStatus.js', () => {
  describe('getOrderStatusLabel', () => {
    it('should return the correct label for a valid status', () => {
      expect(getOrderStatusLabel('PENDING')).toBe('Chờ xử lý')
      expect(getOrderStatusLabel('DELIVERED')).toBe('Đã giao thành công')
    })

    it('should return the fallback (status itself) if status is unknown', () => {
      expect(getOrderStatusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS')
    })
  })

  describe('getOrderStatusBadge', () => {
    it('should return badge config for a valid status', () => {
      const badge = getOrderStatusBadge('CONFIRMED')
      expect(badge).toHaveProperty('color')
      expect(badge).toHaveProperty('icon')
      expect(badge.color).toContain('bg-blue-100')
    })

    it('should return default badge config for unknown status', () => {
      const badge = getOrderStatusBadge('FAKE_STATUS')
      expect(badge.color).toContain('bg-gray-100')
      expect(badge).toHaveProperty('icon')
    })
  })

  describe('formatOrderCurrency', () => {
    it('should format numbers correctly to VND', () => {
      const formatted = formatOrderCurrency(1500000)
      // Different node versions might have slightly different whitespace in currency format (like narrow no-break space)
      // So we check if it contains the number and symbol
      expect(formatted.replace(/\s/g, '')).toMatch(/1\.500\.000(₫|VND)/i)
    })

    it('should format string numbers correctly to VND', () => {
      const formatted = formatOrderCurrency('50000')
      expect(formatted.replace(/\s/g, '')).toMatch(/50\.000(₫|VND)/i)
    })

    it('should handle zero or invalid amounts', () => {
      const zeroFormatted = formatOrderCurrency(0)
      expect(zeroFormatted.replace(/\s/g, '')).toMatch(/0(₫|VND)/i)
      
      const invalidFormatted = formatOrderCurrency('invalid')
      expect(invalidFormatted.replace(/\s/g, '')).toMatch(/0(₫|VND)/i)
    })
  })

  describe('formatOrderDate', () => {
    it('should return empty string if no date is provided', () => {
      expect(formatOrderDate(null)).toBe('')
      expect(formatOrderDate(undefined)).toBe('')
      expect(formatOrderDate('')).toBe('')
    })

    it('should format valid date string', () => {
      const dateStr = '2023-10-15T14:30:00Z'
      const formatted = formatOrderDate(dateStr)
      // Just verifying it doesn't crash and returns a string containing the year
      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('2023')
    })
  })
})
