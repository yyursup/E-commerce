import { describe, it, expect } from 'vitest'
import { getConditionBadge, getWarrantyBadge } from '../../lib/techBadges'

describe('techBadges', () => {
  describe('getConditionBadge', () => {
    it.each([
      ['GRADE_NEW', 'Mới 100% Seal'],
      ['GRADE_LIKE_NEW', 'Like New 99%'],
      ['GRADE_FAIR', 'Cũ 90-95%'],
      ['GRADE_AS_IS', 'Xác máy / Thanh lý'],
    ])('labels %s as "%s"', (grade, label) => {
      const badge = getConditionBadge(grade)
      expect(badge.label).toBe(label)
      expect(badge.cls).toEqual(expect.any(String))
    })

    it('returns null for an unknown or missing grade', () => {
      expect(getConditionBadge('GRADE_X')).toBeNull()
      expect(getConditionBadge(undefined)).toBeNull()
    })
  })

  describe('getWarrantyBadge', () => {
    it('shows "Bao test" when there is no warranty', () => {
      expect(getWarrantyBadge(null).label).toBe('Bao test')
      expect(getWarrantyBadge('KHONG_BAO_HANH', 12).label).toBe('Bao test')
    })

    it('shows the official warranty with its duration', () => {
      expect(getWarrantyBadge('CHINH_HANG', 12).label).toBe('BH Hãng 12T')
      expect(getWarrantyBadge('CHINH_HANG').label).toBe('BH Hãng')
    })

    it('treats any other warranty type as a shop warranty', () => {
      expect(getWarrantyBadge('CUA_HANG', 6).label).toBe('BH Shop 6T')
      expect(getWarrantyBadge('SHOP', 0).label).toBe('BH Shop')
    })
  })
})
