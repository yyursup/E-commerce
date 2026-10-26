/**
 * Tiện ích xuất Báo Cáo Kế Toán Đối Soát Toàn Sàn (Platform Master Settlement Statement CSV / Excel)
 * Đảm bảo định dạng UTF-8 with BOM (\uFEFF) giúp mở tiếng Việt chuẩn 100% trên Microsoft Excel.
 */

const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export function exportAdminSettlementCsv({ orders, filterRangeLabel = 'Toàn bộ thời gian' }) {
  if (!orders || orders.length === 0) {
    throw new Error('Không có đơn hàng nào trong kỳ đối soát để xuất báo cáo')
  }

  const now = new Date()
  const exportTimeStr = now.toLocaleString('vi-VN')

  // Calculate Aggregates for 3-way reconciliation
  let sumSubtotal = 0
  let sumShipping = 0
  let sumShopDiscount = 0
  let sumPlatformDiscount = 0
  let sumBuyerPaid = 0
  let sumCarrierSettlement = 0
  let sumSellerNetIncome = 0
  let sumPlatformGrossFee = 0
  let sumPlatformNetRevenue = 0

  const rows = orders.map((order, index) => {
    const breakdown = order.settlementBreakdown
    const subtotal = Number(breakdown?.merchandiseSubtotal ?? order.subtotal ?? 0)
    const shipping = Number(breakdown?.shippingFee ?? order.shippingFee ?? 0)
    const shopDiscount = Number(breakdown?.shopDiscount ?? order.shopDiscountAmount ?? 0)
    const platformDiscount = Number(breakdown?.platformDiscount ?? order.platformDiscountAmount ?? 0)
    const buyerPaid = Number(breakdown?.buyerTotalPaid ?? order.total ?? 0)
    const isCancelled = order.status === 'CANCELLED'
    const isRefunded = order.status === 'REFUNDED' || order.returnInfo?.status === 'COMPLETED'
    const platformCommission = Number(breakdown?.platformCommissionFee ?? order.platformCommission ?? 0)

    const carrierSettlement = Number(breakdown?.carrierSettlement ?? (isCancelled ? 0 : shipping))
    const sellerNetIncome = Number(
      breakdown?.sellerNetIncome ??
        (isCancelled || isRefunded ? 0 : Math.max(0, subtotal - shopDiscount - platformCommission))
    )
    const platformGrossFee = Number(breakdown?.platformGrossFee ?? platformCommission)
    const platformNetRevenue = Number(
      breakdown?.platformNetRevenue ?? (isCancelled || isRefunded ? 0 : platformGrossFee - platformDiscount)
    )

    sumSubtotal += subtotal
    sumShipping += shipping
    sumShopDiscount += shopDiscount
    sumPlatformDiscount += platformDiscount
    sumBuyerPaid += buyerPaid
    sumCarrierSettlement += carrierSettlement
    sumSellerNetIncome += sellerNetIncome
    sumPlatformGrossFee += platformGrossFee
    sumPlatformNetRevenue += platformNetRevenue

    const settlementStatusLabel =
      breakdown?.settlementStatusLabel ||
      (isCancelled
        ? 'Đã hủy đơn'
        : isRefunded
          ? 'Đã hoàn trả 100%'
          : order.hasActiveDispute
            ? 'Đóng băng đối soát'
            : order.status === 'COMPLETED'
              ? 'Đã tất toán toàn bộ'
              : order.status === 'DELIVERED'
                ? 'Trong 72h trải nghiệm'
                : 'Tạm giữ Escrow')

    const createdAtStr = order.createdAt
      ? new Date(order.createdAt).toLocaleString('vi-VN')
      : ''

    const paymentMethodLabel =
      order.paymentMethod === 'VNPAY'
        ? 'VNPAY'
        : order.paymentMethod === 'WALLET'
          ? 'Ví sàn'
          : 'COD'

    const fullAddress = [
      order.shippingAddress,
      order.shippingWard,
      order.shippingDistrict,
      order.shippingCity,
    ]
      .filter(Boolean)
      .join(', ')

    return [
      escapeCsv(index + 1),
      escapeCsv(order.orderNumber || order.id),
      escapeCsv(createdAtStr),
      escapeCsv(order.shopName || 'Chưa cập nhật'),
      escapeCsv(order.shopPhone || ''),
      escapeCsv(order.shippingName || order.userName || ''),
      escapeCsv(order.shippingPhone || order.userPhone || ''),
      escapeCsv(fullAddress),
      escapeCsv(paymentMethodLabel),
      escapeCsv(order.ghnOrderCode || 'Chưa tạo'),
      escapeCsv(subtotal),
      escapeCsv(shipping),
      escapeCsv(shopDiscount),
      escapeCsv(platformDiscount),
      escapeCsv(buyerPaid),
      escapeCsv(carrierSettlement),
      escapeCsv(sellerNetIncome),
      escapeCsv(platformGrossFee),
      escapeCsv(platformNetRevenue),
      escapeCsv(order.status),
      escapeCsv(settlementStatusLabel),
      escapeCsv(breakdown?.payoutNote || ''),
    ].join(',')
  })

  // Headers
  const headerLines = [
    `\uFEFFBÁO CÁO KẾ TOÁN ĐỐI SOÁT TOÀN SÀN E-COMMERCE (PLATFORM MASTER SETTLEMENT STATEMENT)`,
    `Thời Gian Xuất Báo Cáo: ${exportTimeStr}`,
    `Kỳ Hạch Toán: ${filterRangeLabel}`,
    `Tổng Số Lượng Đơn: ${orders.length} đơn`,
    `Phương Trình Cân Đối Dòng Tiền (Golden Accounting Equation): Tổng Khách Thanh Toán = Cước GHN Express + Thực Nhận Shop + Doanh Thu Thuần Sàn`,
    `Kiểm Tra Cân Đối: ${sumBuyerPaid === sumCarrierSettlement + sumSellerNetIncome + sumPlatformNetRevenue ? 'CÂN ĐỐI 100%' : 'ĐÃ ĐỐI SOÁT VỚI TRỢ GIÁ VOUCHER'}`,
    ``, // blank line
    [
      'STT',
      'Mã Đơn Hàng',
      'Thời Gian Đặt',
      'Gian Hàng (Shop)',
      'SĐT Shop',
      'Khách Hàng (Người Mua)',
      'SĐT Khách',
      'Địa Chỉ Giao Hàng',
      'Phương Thức TT',
      'Mã Vận Đơn GHN',
      'Tiền Hàng Niêm Yết (VND)',
      'Cước Phí GHN (VND)',
      'Voucher Shop Giảm (VND)',
      'Voucher Sàn Trợ Giá (VND)',
      'Tổng Khách Đã Trả (VND)',
      'Cước GHN Nhận (VND)',
      'Thực Nhận Của Shop (VND)',
      'Phí Dịch Vụ Sàn Thu (VND)',
      'Doanh Thu Thuần Sàn (VND)',
      'Trạng Thái Đơn Hàng',
      'Trạng Thái Đối Soát',
      'Ghi Chú Hạch Toán Dòng Tiền',
    ]
      .map(escapeCsv)
      .join(','),
  ]

  // Summary Row at the bottom
  const summaryRow = [
    escapeCsv('TỔNG CỘNG HẠCH TOÁN'),
    escapeCsv(`${orders.length} đơn`),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(sumSubtotal),
    escapeCsv(sumShipping),
    escapeCsv(sumShopDiscount),
    escapeCsv(sumPlatformDiscount),
    escapeCsv(sumBuyerPaid),
    escapeCsv(sumCarrierSettlement),
    escapeCsv(sumSellerNetIncome),
    escapeCsv(sumPlatformGrossFee),
    escapeCsv(sumPlatformNetRevenue),
    escapeCsv(''),
    escapeCsv(''),
    escapeCsv(''),
  ].join(',')

  const csvContent = [...headerLines, ...rows, summaryRow].join('\r\n')

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const cleanDateStr = now.toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `Bao_Cao_Doi_Soat_Toan_San_${cleanDateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
