export const formatAdminRequestDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const isSellerBusiness = (detail) => {
  if (!detail) return false
  const type = String(detail.sellerType || '').toUpperCase()
  return type === 'BUSINESS' || Boolean(detail.businessName || detail.businessLicenseUrl)
}

export const getSellerTypeLabel = (sellerType) => {
  const type = String(sellerType || '').toUpperCase()
  if (type === 'BUSINESS') return 'Doanh nghiệp / Hộ kinh doanh'
  if (type === 'INDIVIDUAL') return 'Cá nhân'
  return sellerType || '-'
}

export const getBusinessTypeLabel = (businessType) => {
  const type = String(businessType || '').toUpperCase()
  if (type === 'ENTERPRISE') return 'Doanh nghiệp'
  if (type === 'HOUSEHOLD') return 'Hộ kinh doanh'
  return businessType || '-'
}

export const getRequestTypeBadge = (type, isDark) => {
  const t = String(type || '').toUpperCase()
  if (t === 'SELLER_REGISTRATION') {
    return {
      label: 'Đăng ký người bán',
      className: isDark
        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        : 'bg-blue-50 text-blue-700 border-blue-200',
    }
  }
  if (t === 'REPORT') {
    return {
      label: 'Báo cáo vi phạm',
      className: isDark
        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        : 'bg-rose-50 text-rose-700 border-rose-200',
    }
  }
  return {
    label: type || '-',
    className: isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600',
  }
}

export const buildSellerInfoSections = (detail) => {
  if (!detail) return null

  const isBusiness = isSellerBusiness(detail)

  // 1. Hồ sơ gian hàng
  const shopInfo = [
    { label: 'Tên shop', value: detail.shopName },
    { label: 'Số điện thoại', value: detail.shopPhone },
    { label: 'Email liên hệ', value: detail.shopEmail },
  ]

  // 2. Pháp lý & Thuế
  const legalInfo = [
    { label: 'Mã số thuế', value: detail.taxCode },
    { label: 'Email nhận hóa đơn', value: detail.invoiceEmail },
  ]

  if (isBusiness) {
    legalInfo.unshift(
      { label: 'Loại hình kinh doanh', value: getBusinessTypeLabel(detail.businessType) },
      { label: 'Tên công ty / Hộ KD', value: detail.businessName },
      { label: 'Địa chỉ trụ sở', value: detail.businessAddress },
    )
  }

  // 3. Địa chỉ giao nhận (Logistics)
  const logisticsInfo = [
    { label: 'Địa chỉ lấy hàng', value: detail.pickupAddress || detail.address },
    { label: 'Địa chỉ trả hàng', value: detail.returnAddress || detail.address },
    { label: 'Địa chỉ đăng ký', value: detail.address },
  ]

  // 4. Tài khoản ngân hàng
  const bankInfo = [
    { label: 'Ngân hàng thụ hưởng', value: detail.bankName },
    { label: 'Số tài khoản', value: detail.bankAccountNumber },
    { label: 'Tên chủ tài khoản', value: detail.bankAccountName },
  ]

  return {
    isBusiness,
    shopInfo: shopInfo.filter((i) => i.value),
    legalInfo: legalInfo.filter((i) => i.value),
    logisticsInfo: logisticsInfo.filter((i) => i.value),
    bankInfo: bankInfo.filter((i) => i.value),
    businessLicenseUrl: detail.businessLicenseUrl || null,
  }
}

export const buildRequestDetailEntries = (requestType, requestDetail) => {
  if (requestType === 'SELLER_REGISTRATION') {
    const sections = buildSellerInfoSections(requestDetail)
    if (!sections) return []

    const entries = [
      ['Loại người bán', sections.isBusiness ? 'Doanh nghiệp / Hộ kinh doanh' : 'Cá nhân'],
      ...sections.shopInfo.map((i) => [i.label, i.value]),
      ...sections.legalInfo.map((i) => [i.label, i.value]),
      ...sections.logisticsInfo.map((i) => [i.label, i.value]),
      ...sections.bankInfo.map((i) => [i.label, i.value]),
    ]
    if (sections.businessLicenseUrl) {
      entries.push(['Giấy phép kinh doanh', sections.businessLicenseUrl])
    }
    return entries
  }

  if (requestType === 'REPORT') {
    return [
      ['Đối tượng báo cáo', requestDetail.targetType],
      ['ID đối tượng', requestDetail.targetId],
      ['Bằng chứng vi phạm', requestDetail.evidenceUrl],
      ['Ghi chú kiểm duyệt', requestDetail.moderatorNote],
    ]
  }

  return Object.entries(requestDetail || {}).map(([key, value]) => [key, String(value || '-')])
}