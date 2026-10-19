/**
 * Tiện ích xuất Báo Cáo Kế Toán Đối Soát Doanh Thu Đơn Hàng (Settlement Statement CSV / Excel)
 * Đảm bảo định dạng UTF-8 with BOM (\uFEFF) giúp mở tiếng Việt chuẩn 100% trên Microsoft Excel.
 */

const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export function exportSellerSettlementCsv({ orders, shopName = 'Shop', filterRangeLabel = 'Tất cả' }) {
  if (!orders || orders.length === 0) {
    throw new Error('Không có đơn hàng nào trong kỳ đối soát để xuất báo cáo')
  }

  const now = new Date()
  const exportTimeStr = now.toLocaleString('vi-VN')

  // Calculate Aggregates
  let sumSubtotal = 0
  let sumShipping = 0
  let sumShopDiscount = 0
  let sumPlatformDiscount = 0
  let sumBuyerPaid = 0
  let sumCommissionBase = 0
  let sumPlatformCommission = 0
  let sumSellerNetIncome = 0

  const rows = orders.map((order, index) => {
    const breakdown = order.settlementBreakdown
    const subtotal = Number(breakdown?.merchandiseSubtotal ?? order.subtotal ?? 0)
    const shipping = Number(breakdown?.shippingFee ?? order.shippingFee ?? 0)
    const shopDiscount = Number(breakdown?.shopDiscount ?? order.shopDiscountAmount ?? 0)
    const platformDiscount = Number(breakdown?.platformDiscount ?? order.platformDiscountAmount ?? 0)
    const buyerPaid = Number(breakdown?.buyerTotalPaid ?? order.total ?? 0)
    const commissionBase = Number(breakdown?.commissionBaseAmount ?? Math.max(0, subtotal - shopDiscount))
    const platformCommission = Number(breakdown?.platformCommissionFee ?? order.platformCommission ?? 0)
    const isCancelled = order.status === 'CANCELLED'
    const isRefunded = order.status === 'REFUNDED' || order.returnInfo?.status === 'COMPLETED'
    const sellerNetIncome = Number(
      breakdown?.sellerNetIncome ??
        (isCancelled || isRefunded ? 0 : Math.max(0, subtotal - shopDiscount - platformCommission))
    )

    sumSubtotal += subtotal
    sumShipping += shipping
    sumShopDiscount += shopDiscount
    sumPlatformDiscount += platformDiscount
    sumBuyerPaid += buyerPaid
    sumCommissionBase += commissionBase
    sumPlatformCommission += platformCommission
    sumSellerNetIncome += sellerNetIncome

    const commissionRate =
      breakdown?.commissionRate != null
        ? `${breakdown.commissionRate}%`
        : order.commissionRate != null
          ? `${order.commissionRate}%`
          : subtotal > 0 && platformCommission > 0
            ? `${((platformCommission / subtotal) * 100).toFixed(1)}%`
            : '0%'

    const settlementStatusLabel =
      breakdown?.settlementStatusLabel ||
      (isCancelled
        ? 'Đã hủy đơn'
        : isRefunded
          ? 'Đã hoàn trả 100%'
          : order.hasActiveDispute
            ? 'Đóng băng đối soát'
            : order.status === 'COMPLETED'
              ? 'Đã giải ngân ví shop'
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
      escapeCsv(order.shippingName || order.userName || ''),
      escapeCsv(order.shippingPhone || order.userPhone || ''),
      escapeCsv(fullAddress),
      escapeCsv(paymentMethodLabel),
      escapeCsv(order.ghnOrderCode || 'Chưa tạo vận đơn'),
      escapeCsv(subtotal),
      escapeCsv(shipping),
      escapeCsv(shopDiscount),
      escapeCsv(platformDiscount),
      escapeCsv(buyerPaid),
      escapeCsv(commissionBase),
      escapeCsv(commissionRate),
      escapeCsv(platformCommission),
      escapeCsv(sellerNetIncome),
      escapeCsv(order.status),
      escapeCsv(settlementStatusLabel),
      escapeCsv(breakdown?.payoutNote || ''),
    ].join(',')
  })

  // Headers
  const headerLines = [
    `\uFEFFBÁO CÁO KẾ TOÁN ĐỐI SOÁT DOANH THU & DÒNG TIỀN ĐƠN HÀNG`,
    `Tên Gian Hàng: ${shopName}`,
    `Thời Gian Xuất: ${exportTimeStr}`,
    `Kỳ Đối Soát: ${filterRangeLabel}`,
    `Số Lượng Đơn Hàng: ${orders.length} đơn`,
    `Phương Trình Cân Đối Dòng Tiền: Tổng Khách Thanh Toán = Cước GHN + Thực Nhận Shop + Doanh Thu Thuần Sàn`,
    ``, // blank line
    [
      'STT',
      'Mã Đơn Hàng',
      'Thời Gian Đặt',
      'Người Mua Hàng',
      'Số Điện Thoại',
      'Địa Chỉ Giao Hàng',
      'Phương Thức TT',
      'Mã Vận Đơn GHN',
      'Tiền Hàng Niêm Yết (VND)',
      'Cước Phí GHN (VND)',
      'Voucher Shop Tài Trợ (VND)',
      'Voucher Sàn Trợ Giá (VND)',
      'Tổng Khách Thanh Toán (VND)',
      'Doanh Thu Tính Phí (VND)',
      'Tỷ Lệ Phí Sàn',
      'Phí Hoa Hồng Sàn (VND)',
      'Thực Nhận Về Ví Shop (VND)',
      'Trạng Thái Đơn Hàng',
      'Trạng Thái Đối Soát Kế Toán',
      'Ghi Chú Hạch Toán Dòng Tiền',
    ]
      .map(escapeCsv)
      .join(','),
  ]

  // Summary Row at the bottom
  const summaryRow = [
    escapeCsv('TỔNG CỘNG'),
    escapeCsv(`${orders.length} đơn`),
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
    escapeCsv(sumCommissionBase),
    escapeCsv(''),
    escapeCsv(sumPlatformCommission),
    escapeCsv(sumSellerNetIncome),
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
  const cleanShopName = shopName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
  link.setAttribute('href', url)
  link.setAttribute('download', `Bao_Cao_Doi_Soat_${cleanShopName}_${cleanDateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
