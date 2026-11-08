import { describe, it, expect } from 'vitest'
import {
  REPORT_TARGET_TYPES,
  normalizeReportTargetType,
  getReportTargetMeta,
  getReportReasonLabel,
  formatReportDescription,
  buildReportCreatePath,
  resolveReportBackPath
} from '../../lib/reportTargets'

describe('reportTargets.js', () => {
  describe('normalizeReportTargetType', () => {
    it('should fallback to PRODUCT for invalid types', () => {
      expect(normalizeReportTargetType(null)).toBe(REPORT_TARGET_TYPES.PRODUCT)
      expect(normalizeReportTargetType(123)).toBe(REPORT_TARGET_TYPES.PRODUCT)
      expect(normalizeReportTargetType('UNKNOWN')).toBe(REPORT_TARGET_TYPES.PRODUCT)
    })

    it('should normalize valid strings ignoring case and space', () => {
      expect(normalizeReportTargetType(' shop ')).toBe(REPORT_TARGET_TYPES.SHOP)
      expect(normalizeReportTargetType('reView')).toBe(REPORT_TARGET_TYPES.REVIEW)
    })
  })

  describe('getReportTargetMeta', () => {
    it('should return metadata for a given target type', () => {
      const meta = getReportTargetMeta('SHOP')
      expect(meta.label).toBe('Shop')
      expect(meta.reasons.length).toBeGreaterThan(0)
    })

    it('should return PRODUCT metadata for unknown target type', () => {
      const meta = getReportTargetMeta('ALIEN')
      expect(meta.key).toBe(REPORT_TARGET_TYPES.PRODUCT)
    })
  })

  describe('getReportReasonLabel', () => {
    it('should return label for known reason', () => {
      expect(getReportReasonLabel('PRODUCT', 'FRAUD')).toBe('Lừa đảo / gian lận')
    })

    it('should return fallback if reason is not found but is provided', () => {
      expect(getReportReasonLabel('PRODUCT', 'CUSTOM_REASON')).toBe('CUSTOM_REASON')
    })
    
    it('should return the first reason label if reason is empty', () => {
      expect(getReportReasonLabel('PRODUCT', undefined)).toBe('Hàng giả / hàng cấm')
    })
  })

  describe('formatReportDescription', () => {
    it('should return null if description is empty or only whitespace', () => {
      expect(formatReportDescription({ targetType: 'PRODUCT', reason: 'FRAUD', description: '   ' })).toBeNull()
      expect(formatReportDescription({ targetType: 'PRODUCT', reason: 'FRAUD' })).toBeNull()
    })

    it('should format description with reason label prefix', () => {
      const formatted = formatReportDescription({
        targetType: 'SHOP',
        reason: 'SCAM',
        description: 'Shop này lừa đảo tôi'
      })
      expect(formatted).toBe('[Dấu hiệu lừa đảo] Shop này lừa đảo tôi')
    })
  })

  describe('buildReportCreatePath', () => {
    it('should build basic path', () => {
      expect(buildReportCreatePath({})).toBe('/report?targetType=PRODUCT')
    })

    it('should build path with all parameters', () => {
      const path = buildReportCreatePath({
        targetId: '123',
        targetType: 'shop',
        targetName: ' My Shop ',
        backTo: '/some-page'
      })
      expect(path).toContain('targetId=123')
      expect(path).toContain('targetType=SHOP')
      expect(path).toContain('targetName=My+Shop')
      expect(path).toContain('backTo=%2Fsome-page')
    })
  })

  describe('resolveReportBackPath', () => {
    it('should return null for invalid types', () => {
      expect(resolveReportBackPath(null)).toBeNull()
      expect(resolveReportBackPath({})).toBeNull()
    })

    it('should return null if path does not start with /', () => {
      expect(resolveReportBackPath('google.com')).toBeNull()
    })

    it('should return trimmed valid path', () => {
      expect(resolveReportBackPath('  /products/123  ')).toBe('/products/123')
    })
  })
})
