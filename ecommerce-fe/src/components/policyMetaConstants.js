import {
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineScale,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineTag,
  HiOutlineDocumentText,
} from 'react-icons/hi'

  /**
   * Dynamic Category Icon Resolver
   * Maps policy category or keywords to intuitive icons, defaulting to HiOutlineDocumentText.
   * Data-driven architecture: Any new policy created by Admin or Backend will automatically
   * get an appropriate icon without modifying Frontend code!
   */
  export function getCategoryIcon(category = '', key = '') {
    const cat = String(category || '').toUpperCase()
  const k = String(key || '').toUpperCase()

  if (cat.includes('ESCROW') || k.includes('ESCROW')) return HiOutlineShieldCheck
if (cat.includes('RETURN') || cat.includes('REFUND') || k.includes('RETURN') || k.includes('REFUND')) return HiOutlineRefresh
if (cat.includes('SHIPPING') || k.includes('SHIPPING') || cat.includes('DELIVERY')) return HiOutlineTruck
if (cat.includes('SELLER') || k.includes('SELLER') || cat.includes('MERCHANT')) return HiOutlineScale
if (
  cat.includes('DISCIPLINE') ||
  cat.includes('PENALTY') ||
  cat.includes('REPUTATION') ||
  k.includes('DISCIPLINE') ||
  k.includes('CLAUSE')
) {
  return HiOutlineCheckCircle
}
if (cat.includes('PRIVACY') || cat.includes('SECURITY') || k.includes('PRIVACY')) return HiOutlineLockClosed
if (
  cat.includes('GRADE') ||
  cat.includes('GRADING') ||
  cat.includes('CONDITION') ||
  k.includes('CONDITION') ||
  k.includes('SPEC')
) {
  return HiOutlineTag
}

return HiOutlineDocumentText
}

/**
 * Dynamic Target Audience Label Resolver
 */
  export function getAudienceLabel(audience = 'ALL') {
    const aud = String(audience || '').toUpperCase()
    if (aud === 'SELLER') return 'Dành cho Người bán'
    if (aud === 'BUYER') return 'Dành cho Người mua'
    return 'Toàn sàn (Tất cả)'
  }

  /**
   * Dynamic Category Label Resolver with graceful fallback
   */
  export const CATEGORY_LABEL_MAP = {
    ESCROW: 'Bảo Vệ Escrow',
    RETURN: 'Đổi Trả & Khiếu Nại',
    RETURN_REFUND: 'Đổi Trả & Khiếu Nại',
    SHIPPING: 'Vận Chuyển GHN & Đồng Kiểm',
    SELLER: 'Quy Chế Người Bán',
    SELLER_RULES: 'Quy Chế Người Bán',
    DISCIPLINE: 'Kỷ Luật & Điểm Uy Tín',
    PRIVACY: 'Chính Sách Bảo Mật',
    CONDITION_GRADE: 'Phân Hạng Hàng Cũ & Like New',
    GRADING: 'Phân Hạng Hàng Cũ & Like New',
    GENERAL: 'Quy Chế Hoạt Động Chung',
    TERMS: 'Quy Chế Hoạt Động Chung',
  }

  export function getCategoryLabel(category = 'GENERAL') {
    const cat = String(category || '').toUpperCase()
    return CATEGORY_LABEL_MAP[cat] || 'Quy Chế Nền Tảng'
  }

  /**
   * Backwards compatibility helper
   * Always prioritizes dynamic database title (p.title) — NEVER converts keys into English strings!
   */
  export function getPolicyMeta(key, fallbackTitle) {
    return {
      label: fallbackTitle || null,
      icon: getCategoryIcon('', key),
    }
  }
