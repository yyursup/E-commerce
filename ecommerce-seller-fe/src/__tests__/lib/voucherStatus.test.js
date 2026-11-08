import { describe, it, expect } from 'vitest'
import {
  VOUCHER_STATUS_FILTER_OPTIONS,
  getVoucherDisplayStatus,
  getVoucherBadgeConfig,
  canEditVoucher,
  isVoucherStarted,
  canDeleteVoucher,
} from '../../lib/voucherStatus'

// Fixed clock so date boundaries are deterministic.
const NOW = new Date('2026-06-15T12:00:00Z')
const PAST = '2026-06-01T00:00:00Z'
const FUTURE = '2026-07-01T00:00:00Z'

const voucher = (overrides = {}) => ({
  status: 'ACTIVE',
  startDate: PAST,
  endDate: FUTURE,
  usageLimit: 100,
  usedCount: 10,
  ...overrides,
})

describe('voucherStatus (seller)', () => {
  describe('VOUCHER_STATUS_FILTER_OPTIONS', () => {
    it('starts with ALL and has a unique key per option', () => {
      expect(VOUCHER_STATUS_FILTER_OPTIONS[0].key).toBe('ALL')
      const keys = VOUCHER_STATUS_FILTER_OPTIONS.map((o) => o.key)
      expect(new Set(keys).size).toBe(keys.length)
    })
  })

  describe('getVoucherDisplayStatus', () => {
    it('returns UNKNOWN for a missing voucher', () => {
      expect(getVoucherDisplayStatus(null, NOW)).toEqual({ key: 'UNKNOWN', label: 'Không xác định' })
    })

    it('returns ACTIVE for a running voucher', () => {
      expect(getVoucherDisplayStatus(voucher(), NOW).key).toBe('ACTIVE')
    })

    it('treats DELETED as the highest priority, even when also exhausted and expired', () => {
      const v = voucher({ status: 'DELETED', usedCount: 100, endDate: PAST })
      expect(getVoucherDisplayStatus(v, NOW)).toEqual({ key: 'DELETED', label: 'Đã hủy' })
    })

    it('marks a voucher EXHAUSTED when usedCount reaches usageLimit', () => {
      expect(getVoucherDisplayStatus(voucher({ usedCount: 100 }), NOW).key).toBe('EXHAUSTED')
      expect(getVoucherDisplayStatus(voucher({ usedCount: 150 }), NOW).key).toBe('EXHAUSTED')
    })

    it('ranks EXHAUSTED above EXPIRED', () => {
      expect(getVoucherDisplayStatus(voucher({ usedCount: 100, endDate: PAST }), NOW).key).toBe('EXHAUSTED')
    })

    it('never exhausts a voucher without a usage limit', () => {
      expect(getVoucherDisplayStatus(voucher({ usageLimit: null, usedCount: 9999 }), NOW).key).toBe('ACTIVE')
    })

    it('marks a voucher EXPIRED from the enum or from a past endDate', () => {
      expect(getVoucherDisplayStatus(voucher({ status: 'EXPIRED' }), NOW).key).toBe('EXPIRED')
      expect(getVoucherDisplayStatus(voucher({ endDate: PAST }), NOW).key).toBe('EXPIRED')
    })

    it('ignores an empty endDate', () => {
      expect(getVoucherDisplayStatus(voucher({ endDate: '' }), NOW).key).toBe('ACTIVE')
    })

    it('ranks INACTIVE above UPCOMING', () => {
      expect(getVoucherDisplayStatus(voucher({ status: 'INACTIVE', startDate: FUTURE }), NOW).key).toBe('INACTIVE')
    })

    it('marks a voucher UPCOMING when startDate is in the future', () => {
      expect(getVoucherDisplayStatus(voucher({ startDate: FUTURE, endDate: '2026-08-01T00:00:00Z' }), NOW)).toEqual({
        key: 'UPCOMING',
        label: 'Sắp diễn ra',
      })
    })

    it('falls back to the raw status for unknown values', () => {
      expect(getVoucherDisplayStatus(voucher({ status: 'WEIRD' }), NOW)).toEqual({ key: 'UNKNOWN', label: 'WEIRD' })
    })

    it('accepts the reference time as a string or timestamp', () => {
      expect(getVoucherDisplayStatus(voucher({ endDate: PAST }), NOW.toISOString()).key).toBe('EXPIRED')
      expect(getVoucherDisplayStatus(voucher({ endDate: PAST }), NOW.getTime()).key).toBe('EXPIRED')
    })
  })

  describe('getVoucherBadgeConfig', () => {
    it.each(['ACTIVE', 'UPCOMING', 'INACTIVE', 'EXHAUSTED', 'EXPIRED', 'DELETED', 'UNKNOWN'])(
      'returns badge and dot classes for %s in both themes',
      (key) => {
        for (const isDark of [true, false]) {
          const cfg = getVoucherBadgeConfig(key, isDark)
          expect(cfg.badgeClass).toEqual(expect.any(String))
          expect(cfg.dotClass).toEqual(expect.any(String))
        }
      },
    )

    it('uses different classes for light and dark mode', () => {
      expect(getVoucherBadgeConfig('ACTIVE', true).badgeClass).not.toBe(getVoucherBadgeConfig('ACTIVE', false).badgeClass)
    })

    it('pulses the dot only for running vouchers', () => {
      expect(getVoucherBadgeConfig('ACTIVE', false).dotClass).toContain('animate-pulse')
      expect(getVoucherBadgeConfig('EXPIRED', false).dotClass).not.toContain('animate-pulse')
    })
  })

  describe('canEditVoucher', () => {
    const upcoming = () => voucher({ startDate: FUTURE, endDate: '2026-08-01T00:00:00Z' })

    it('allows editing an ACTIVE voucher that has not started yet', () => {
      expect(canEditVoucher(upcoming(), false, NOW)).toBe(true)
    })

    it('rejects a missing voucher or a closed shop', () => {
      expect(canEditVoucher(null, false, NOW)).toBe(false)
      expect(canEditVoucher(upcoming(), true, NOW)).toBe(false)
    })

    it('rejects a voucher that has already started', () => {
      expect(canEditVoucher(voucher(), false, NOW)).toBe(false)
      expect(canEditVoucher(voucher({ startDate: NOW.toISOString() }), false, NOW)).toBe(false)
    })

    it('rejects a voucher without a valid startDate', () => {
      expect(canEditVoucher(voucher({ startDate: null }), false, NOW)).toBe(false)
      expect(canEditVoucher(voucher({ startDate: 'not-a-date' }), false, NOW)).toBe(false)
    })

    it('rejects non-ACTIVE statuses', () => {
      for (const status of ['INACTIVE', 'DELETED', 'EXPIRED', 'EXHAUSTED']) {
        expect(canEditVoucher({ ...upcoming(), status }, false, NOW)).toBe(false)
      }
    })

    it('rejects an expired or exhausted voucher', () => {
      expect(canEditVoucher({ ...upcoming(), endDate: PAST }, false, NOW)).toBe(false)
      expect(canEditVoucher({ ...upcoming(), usedCount: 100 }, false, NOW)).toBe(false)
    })
  })

  describe('isVoucherStarted', () => {
    it('treats a missing voucher, missing startDate or invalid date as started', () => {
      expect(isVoucherStarted(null, NOW)).toBe(true)
      expect(isVoucherStarted(voucher({ startDate: null }), NOW)).toBe(true)
      expect(isVoucherStarted(voucher({ startDate: 'garbage' }), NOW)).toBe(true)
    })

    it('is started exactly at startDate and after it', () => {
      expect(isVoucherStarted(voucher({ startDate: NOW.toISOString() }), NOW)).toBe(true)
      expect(isVoucherStarted(voucher({ startDate: PAST }), NOW)).toBe(true)
    })

    it('is not started before startDate', () => {
      expect(isVoucherStarted(voucher({ startDate: FUTURE }), NOW)).toBe(false)
    })
  })

  describe('canDeleteVoucher', () => {
    it('allows ending an ACTIVE voucher, started or not', () => {
      expect(canDeleteVoucher(voucher(), NOW)).toBe(true)
      expect(canDeleteVoucher(voucher({ startDate: FUTURE, endDate: '2026-08-01T00:00:00Z' }), NOW)).toBe(true)
    })

    it('allows deleting an INACTIVE voucher only before it starts', () => {
      expect(canDeleteVoucher(voucher({ status: 'INACTIVE', startDate: FUTURE, endDate: '2026-08-01T00:00:00Z' }), NOW)).toBe(true)
      expect(canDeleteVoucher(voucher({ status: 'INACTIVE' }), NOW)).toBe(false)
    })

    it('rejects deleted, expired and exhausted vouchers', () => {
      expect(canDeleteVoucher(null, NOW)).toBe(false)
      expect(canDeleteVoucher(voucher({ status: 'DELETED' }), NOW)).toBe(false)
      expect(canDeleteVoucher(voucher({ status: 'EXPIRED' }), NOW)).toBe(false)
      expect(canDeleteVoucher(voucher({ endDate: PAST }), NOW)).toBe(false)
      expect(canDeleteVoucher(voucher({ status: 'EXHAUSTED' }), NOW)).toBe(false)
      expect(canDeleteVoucher(voucher({ usedCount: 100 }), NOW)).toBe(false)
    })

    it('rejects unknown statuses', () => {
      expect(canDeleteVoucher(voucher({ status: 'DRAFT' }), NOW)).toBe(false)
    })
  })
})
