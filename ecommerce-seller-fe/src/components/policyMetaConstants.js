import {
  HiOutlineShieldCheck,
  HiOutlineScale,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineTag,
  HiOutlineDocumentText,
} from 'react-icons/hi'

export const POLICY_META_MAP = {
  PLATFORM_OPERATING_REGULATIONS: {
    label: 'Quy Chế Hoạt Động',
    icon: HiOutlineScale,
    aliases: ['TERMS_OF_SERVICE', 'GENERAL_TERMS'],
  },
  SELLER_OPERATING_POLICY: {
    label: 'Quy Chế Gian Hàng & eKYC',
    icon: HiOutlineCash,
    aliases: ['SELLER_OPERATING_REGULATIONS', 'SELLER_POLICY'],
  },
  ESCROW_PAYMENT_PROTECTION: {
    label: 'Ký Quỹ Escrow (72h)',
    icon: HiOutlineShieldCheck,
    aliases: ['ESCROW'],
  },
  RETURN_REFUND_COMPLAINT_POLICY: {
    label: 'Khiếu Nại & Đổi Trả',
    icon: HiOutlineTruck,
    aliases: ['RETURN_REFUND_POLICY', 'RETURNS'],
  },
  PRODUCT_LISTING_AND_CONDITION_STANDARDS: {
    label: 'Tiêu Chuẩn Đăng Bán',
    icon: HiOutlineTag,
    aliases: ['CONDITION_GRADE', 'SECOND_HAND_GRADING'],
  },
  SHIPPING_AND_CO_INSPECTION_POLICY: {
    label: 'Vận Chuyển GHN & Đồng Kiểm',
    icon: HiOutlineTruck,
    aliases: ['SHIPPING_AND_DELIVERY', 'SHIPPING'],
  },
  DISCIPLINE_AND_REPUTATION_SYSTEM: {
    label: 'Kỷ Luật 7 Gậy & Uy Tín',
    icon: HiOutlineCheckCircle,
    aliases: ['DISCIPLINE'],
  },
  PRIVACY_AND_DATA_PROTECTION: {
    label: 'Bảo Mật Dữ Liệu',
    icon: HiOutlineLockClosed,
    aliases: ['PRIVACY_POLICY', 'PRIVACY'],
  },
}

/**
 * Resolve icon, label, and fallback metadata for any policy key
 */
export function getPolicyMeta(key) {
  if (!key) {
    return {
      label: 'Chính Sách',
      icon: HiOutlineDocumentText,
    }
  }
  if (POLICY_META_MAP[key]) return POLICY_META_MAP[key]
  for (const [, meta] of Object.entries(POLICY_META_MAP)) {
    if (meta.aliases?.includes(key)) {
      return meta
    }
  }
  return {
    label: key.replace(/_/g, ' '),
    icon: HiOutlineDocumentText,
  }
}
