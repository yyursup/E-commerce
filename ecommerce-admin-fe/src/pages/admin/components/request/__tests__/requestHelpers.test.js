import { describe, it, expect } from 'vitest'
import {
  isSellerBusiness,
  getSellerTypeLabel,
  getBusinessTypeLabel,
  getRequestTypeBadge,
  buildSellerInfoSections,
  buildRequestDetailEntries,
  formatAdminRequestDate,
} from '../requestHelpers'

describe('requestHelpers', () => {
  describe('isSellerBusiness', () => {
    it('returns false for null or undefined', () => {
      expect(isSellerBusiness(null)).toBe(false)
      expect(isSellerBusiness(undefined)).toBe(false)
    })

    it('returns false for individual seller without business fields', () => {
      const detail = { sellerType: 'INDIVIDUAL', shopName: 'Shop A' }
      expect(isSellerBusiness(detail)).toBe(false)
    })

    it('returns true when sellerType is BUSINESS', () => {
      const detail = { sellerType: 'BUSINESS', shopName: 'Tech Corp' }
      expect(isSellerBusiness(detail)).toBe(true)
    })

    it('returns true when businessName is provided even if sellerType is not explicitly BUSINESS', () => {
      const detail = { businessName: 'Tech Corp Ltd' }
      expect(isSellerBusiness(detail)).toBe(true)
    })

    it('returns true when businessLicenseUrl is provided', () => {
      const detail = { businessLicenseUrl: 'https://cdn.example.com/license.jpg' }
      expect(isSellerBusiness(detail)).toBe(true)
    })
  })

  describe('getSellerTypeLabel', () => {
    it('returns correct label for BUSINESS', () => {
      expect(getSellerTypeLabel('BUSINESS')).toBe('Doanh nghiệp / Hộ kinh doanh')
    })

    it('returns correct label for INDIVIDUAL', () => {
      expect(getSellerTypeLabel('INDIVIDUAL')).toBe('Cá nhân')
    })

    it('returns default fallback for unknown types', () => {
      expect(getSellerTypeLabel(null)).toBe('-')
      expect(getSellerTypeLabel('OTHER')).toBe('OTHER')
    })
  })

  describe('getBusinessTypeLabel', () => {
    it('returns correct label for ENTERPRISE and HOUSEHOLD', () => {
      expect(getBusinessTypeLabel('ENTERPRISE')).toBe('Doanh nghiệp')
      expect(getBusinessTypeLabel('HOUSEHOLD')).toBe('Hộ kinh doanh')
    })

    it('returns default fallback', () => {
      expect(getBusinessTypeLabel(null)).toBe('-')
    })
  })

  describe('getRequestTypeBadge', () => {
    it('returns SELLER_REGISTRATION badge info', () => {
      const badgeLight = getRequestTypeBadge('SELLER_REGISTRATION', false)
      expect(badgeLight.label).toBe('Đăng ký người bán')
      expect(badgeLight.className).toContain('text-blue-700')

      const badgeDark = getRequestTypeBadge('SELLER_REGISTRATION', true)
      expect(badgeDark.className).toContain('text-blue-300')
    })

    it('returns REPORT badge info', () => {
      const badge = getRequestTypeBadge('REPORT', false)
      expect(badge.label).toBe('Báo cáo vi phạm')
      expect(badge.className).toContain('text-rose-700')
    })

    it('returns fallback badge for unknown type', () => {
      const badge = getRequestTypeBadge('CUSTOM', false)
      expect(badge.label).toBe('CUSTOM')
    })
  })

  describe('buildSellerInfoSections', () => {
    it('returns null if detail is falsy', () => {
      expect(buildSellerInfoSections(null)).toBeNull()
    })

    it('builds sections correctly for INDIVIDUAL seller', () => {
      const detail = {
        sellerType: 'INDIVIDUAL',
        shopName: 'Shop Ca Nhan',
        shopPhone: '0901234567',
        shopEmail: 'seller@test.com',
        taxCode: '0123456789',
        invoiceEmail: 'invoice@test.com',
        pickupAddress: '123 Nguyen Trai, Q1',
        returnAddress: '456 Le Loi, Q1',
        bankName: 'Vietcombank',
        bankAccountNumber: '9876543210',
        bankAccountName: 'NGUYEN VAN A',
      }

      const result = buildSellerInfoSections(detail)
      expect(result.isBusiness).toBe(false)
      expect(result.shopInfo).toHaveLength(3)
      expect(result.legalInfo).toHaveLength(2)
      expect(result.logisticsInfo).toHaveLength(2)
      expect(result.bankInfo).toHaveLength(3)
      expect(result.businessLicenseUrl).toBeNull()
    })

    it('builds sections correctly for BUSINESS seller with GPKD', () => {
      const detail = {
        sellerType: 'BUSINESS',
        businessType: 'ENTERPRISE',
        businessName: 'Cong Ty TNHH Thuong Mai ABC',
        businessAddress: '789 Vo Van Tan, Q3',
        businessLicenseUrl: 'https://cdn.example.com/gpkd.png',
        shopName: 'ABC Official Store',
        shopPhone: '0281234567',
        shopEmail: 'contact@abc.vn',
        taxCode: '0312345678',
        invoiceEmail: 'einvoice@abc.vn',
        pickupAddress: 'Kho Tong ABC, Binh Duong',
        returnAddress: 'Kho Tong ABC, Binh Duong',
        bankName: 'MBBank',
        bankAccountNumber: '1122334455',
        bankAccountName: 'CTY TNHH TM ABC',
      }

      const result = buildSellerInfoSections(detail)
      expect(result.isBusiness).toBe(true)
      expect(result.businessLicenseUrl).toBe('https://cdn.example.com/gpkd.png')
      expect(result.legalInfo.some((item) => item.label === 'Loại hình kinh doanh' && item.value === 'Doanh nghiệp')).toBe(true)
      expect(result.legalInfo.some((item) => item.label === 'Tên công ty / Hộ KD' && item.value === 'Cong Ty TNHH Thuong Mai ABC')).toBe(true)
      expect(result.legalInfo.some((item) => item.label === 'Địa chỉ trụ sở' && item.value === '789 Vo Van Tan, Q3')).toBe(true)
    })
  })

  describe('buildRequestDetailEntries', () => {
    it('returns empty array if requestDetail is null for SELLER_REGISTRATION', () => {
      expect(buildRequestDetailEntries('SELLER_REGISTRATION', null)).toEqual([])
    })

    it('formats key-values for SELLER_REGISTRATION', () => {
      const detail = {
        sellerType: 'INDIVIDUAL',
        shopName: 'Shop A',
        shopPhone: '0901234567',
      }
      const entries = buildRequestDetailEntries('SELLER_REGISTRATION', detail)
      expect(entries).toContainEqual(['Loại người bán', 'Cá nhân'])
      expect(entries).toContainEqual(['Tên shop', 'Shop A'])
      expect(entries).toContainEqual(['Số điện thoại', '0901234567'])
    })

    it('formats key-values for REPORT', () => {
      const detail = {
        targetType: 'PRODUCT',
        targetId: 'prod-123',
        evidenceUrl: 'https://example.com/fake.png',
        moderatorNote: 'Hàng giả hàng nhái',
      }
      const entries = buildRequestDetailEntries('REPORT', detail)
      expect(entries).toContainEqual(['Đối tượng báo cáo', 'PRODUCT'])
      expect(entries).toContainEqual(['ID đối tượng', 'prod-123'])
    })
  })

  describe('formatAdminRequestDate', () => {
    it('returns - for empty value', () => {
      expect(formatAdminRequestDate(null)).toBe('-')
      expect(formatAdminRequestDate('')).toBe('-')
    })

    it('formats valid ISO date string', () => {
      const formatted = formatAdminRequestDate('2026-03-15T10:30:00Z')
      expect(typeof formatted).toBe('string')
      expect(formatted).not.toBe('-')
    })
  })
})
