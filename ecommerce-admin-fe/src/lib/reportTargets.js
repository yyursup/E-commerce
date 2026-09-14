export const REPORT_TARGET_TYPES = Object.freeze({
  PRODUCT: 'PRODUCT',
  SHOP: 'SHOP',
  REVIEW: 'REVIEW',
  USER: 'USER',
})

const REPORT_TARGET_META = {
  [REPORT_TARGET_TYPES.PRODUCT]: {
    key: REPORT_TARGET_TYPES.PRODUCT,
    label: 'Sản phẩm',
    defaultName: 'Sản phẩm này',
    pageTitle: 'Báo cáo sản phẩm',
    pageDescription:
      'Chia sẻ lý do bạn cho rằng sản phẩm này vi phạm chính sách hoặc gây rủi ro cho người mua.',
    descriptionPlaceholder:
      'Mô tả chi tiết vấn đề bạn gặp phải, ví dụ như thông tin sai lệch, hàng cấm, hàng giả...',
    reasons: [
      { value: 'COUNTERFEIT', label: 'Hàng giả / hàng cấm' },
      { value: 'MISLEADING', label: 'Thông tin sai lệch' },
      { value: 'FRAUD', label: 'Lừa đảo / gian lận' },
      { value: 'COPYRIGHT', label: 'Vi phạm sở hữu nội dung' },
      { value: 'OTHER', label: 'Khác' },
    ],
  },
  [REPORT_TARGET_TYPES.SHOP]: {
    key: REPORT_TARGET_TYPES.SHOP,
    label: 'Shop',
    defaultName: 'Shop này',
    pageTitle: 'Báo cáo shop',
    pageDescription:
      'Báo cáo nếu shop có dấu hiệu gian lận, hành vi không phù hợp hoặc vi phạm quy định sàn.',
    descriptionPlaceholder:
      'Mô tả hành vi cụ thể của shop: giao dịch bất thường, hành vi quấy rối, bán hàng cấm...',
    reasons: [
      { value: 'SCAM', label: 'Dấu hiệu lừa đảo' },
      { value: 'ABUSIVE_BEHAVIOR', label: 'Hành vi không phù hợp' },
      { value: 'POLICY_VIOLATION', label: 'Vi phạm quy định sàn' },
      { value: 'COUNTERFEIT', label: 'Bán hàng giả / hàng cấm' },
      { value: 'OTHER', label: 'Khác' },
    ],
  },
  [REPORT_TARGET_TYPES.REVIEW]: {
    key: REPORT_TARGET_TYPES.REVIEW,
    label: 'Đánh giá',
    defaultName: 'Đánh giá này',
    pageTitle: 'Báo cáo đánh giá',
    pageDescription:
      'Báo cáo khi nội dung đánh giá có dấu hiệu spam, bịa đặt, xúc phạm hoặc cố tình gây hiểu lầm.',
    descriptionPlaceholder:
      'Mô tả lý do đánh giá này cần được kiểm tra, ví dụ như spam, ngôn ngữ xúc phạm, review không trung thực...',
    reasons: [
      { value: 'FAKE_REVIEW', label: 'Review giả / không trung thực' },
      { value: 'SPAM', label: 'Spam / nội dung rác' },
      { value: 'HARASSMENT', label: 'Xúc phạm / quấy rối' },
      { value: 'MISLEADING', label: 'Gây hiểu lầm' },
      { value: 'OTHER', label: 'Khác' },
    ],
  },
  [REPORT_TARGET_TYPES.USER]: {
    key: REPORT_TARGET_TYPES.USER,
    label: 'Người dùng',
    defaultName: 'Người dùng này',
    pageTitle: 'Báo cáo người dùng',
    pageDescription:
      'Báo cáo khi tài khoản có hành vi lừa đảo, giả mạo, quấy rối hoặc lạm dụng nền tảng.',
    descriptionPlaceholder:
      'Mô tả hành vi cụ thể của người dùng mà bạn muốn báo cáo để đội ngũ kiểm duyệt xử lý.',
    reasons: [
      { value: 'HARASSMENT', label: 'Quấy rối / xúc phạm' },
      { value: 'FRAUD', label: 'Lừa đảo / gian lận' },
      { value: 'IMPERSONATION', label: 'Giả mạo danh tính' },
      { value: 'SPAM', label: 'Spam / lạm dụng' },
      { value: 'OTHER', label: 'Khác' },
    ],
  },
}

export function normalizeReportTargetType(value) {
  if (typeof value !== 'string') {
    return REPORT_TARGET_TYPES.PRODUCT
  }

  const normalized = value.trim().toUpperCase()
  return REPORT_TARGET_META[normalized] ? normalized : REPORT_TARGET_TYPES.PRODUCT
}

export function getReportTargetMeta(targetType) {
  return REPORT_TARGET_META[normalizeReportTargetType(targetType)]
}

export function getReportReasonLabel(targetType, reasonValue) {
  const meta = getReportTargetMeta(targetType)
  const matchedReason = meta.reasons.find((reason) => reason.value === reasonValue)
  return matchedReason?.label || reasonValue || meta.reasons[0]?.label || ''
}

export function formatReportDescription({ targetType, reason, description }) {
  const trimmedDescription = description?.trim()

  if (!trimmedDescription) {
    return null
  }

  const reasonLabel = getReportReasonLabel(targetType, reason)
  return reasonLabel ? `[${reasonLabel}] ${trimmedDescription}` : trimmedDescription
}

export function buildReportCreatePath({ targetId, targetType, targetName, backTo }) {
  const searchParams = new URLSearchParams()

  if (targetId) {
    searchParams.set('targetId', targetId)
  }

  const normalizedTargetType = normalizeReportTargetType(targetType)
  if (normalizedTargetType) {
    searchParams.set('targetType', normalizedTargetType)
  }

  if (targetName?.trim()) {
    searchParams.set('targetName', targetName.trim())
  }

  if (backTo?.trim()) {
    searchParams.set('backTo', backTo.trim())
  }

  const query = searchParams.toString()
  return query ? `/report?${query}` : '/report'
}

export function resolveReportBackPath(backTo) {
  if (typeof backTo !== 'string') {
    return null
  }

  const trimmed = backTo.trim()
  return trimmed.startsWith('/') ? trimmed : null
}
