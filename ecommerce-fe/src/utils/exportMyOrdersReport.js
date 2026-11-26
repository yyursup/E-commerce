/**
 * Xuất lịch sử đơn mua của khách ra CSV (UTF-8 BOM để Excel đọc đúng tiếng Việt).
 */
import { getOrderStatusLabel, getReturnStatusLabel } from '../lib/orderStatus'

const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
const num = (v) => Number(v) || 0

const HEADER = [
  'STT', 'Mã đơn', 'Ngày đặt', 'Gian hàng', 'Sản phẩm',
  'Tiền hàng', 'Phí vận chuyển', 'Giảm giá shop', 'Giảm giá sàn', 'Tổng thanh toán',
  'Phương thức thanh toán', 'Trạng thái', 'Đổi trả',
]

// Đơn đã hủy / hoàn tiền không tính vào "đã chi"
const NOT_SPENT = ['CANCELLED', 'REFUNDED', 'PENDING_PAYMENT']

export function buildMyOrdersCsv(orders, { filterLabel = 'Tất cả', now = new Date() } = {}) {
  if (!orders || orders.length === 0) {
    throw new Error('Không có đơn hàng nào để xuất báo cáo')
  }

  let sumSubtotal = 0, sumShip = 0, sumShopDisc = 0, sumPlatDisc = 0, sumTotal = 0, sumSpent = 0

  const rows = orders.map((o, i) => {
    const subtotal = num(o.subtotal)
    const ship = num(o.shippingFee)
    const shopDisc = num(o.shopDiscountAmount)
    const platDisc = num(o.platformDiscountAmount)
    const total = num(o.total)
    sumSubtotal += subtotal
    sumShip += ship
    sumShopDisc += shopDisc
    sumPlatDisc += platDisc
    sumTotal += total
    if (!NOT_SPENT.includes(o.status)) sumSpent += total

    const items = (o.items || [])
      .map((it) => `${it.productName || 'Sản phẩm'} x${it.quantity ?? 1}`)
      .join('; ')

    return [
      i + 1,
      o.orderNumber || o.id,
      o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
      o.shopName || '',
      items,
      subtotal, ship, shopDisc, platDisc, total,
      o.paymentMethod || '',
      getOrderStatusLabel(o.status),
      o.returnInfo?.status ? getReturnStatusLabel(o.returnInfo.status) : '',
    ].map(esc).join(',')
  })

  const lines = [
    `﻿${esc('BÁO CÁO ĐỐI SOÁT LỊCH SỬ MUA HÀNG')}`,
    [esc('Thời điểm xuất'), esc(now.toLocaleString('vi-VN'))].join(','),
    [esc('Bộ lọc'), esc(filterLabel)].join(','),
    [esc('Tổng đã chi (không tính đơn hủy/hoàn/chưa thanh toán)'), esc(sumSpent)].join(','),
    '',
    HEADER.map(esc).join(','),
    ...rows,
    ['TỔNG CỘNG', `${orders.length} đơn`, '', '', '', sumSubtotal, sumShip, sumShopDisc, sumPlatDisc, sumTotal, '', '', '']
      .map(esc)
      .join(','),
  ]
  return lines.join('\r\n')
}

export function exportMyOrdersCsv(orders, options = {}) {
  const csv = buildMyOrdersCsv(orders, options)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `Lich_Su_Don_Mua_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
