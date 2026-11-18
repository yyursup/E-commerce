export const formatVnd = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0)

export const DIRECTION_OPTIONS = [
  { value: '', label: 'Cả hai chiều' },
  { value: 'OUTBOUND', label: 'Chiều đi (shop → người mua)' },
  { value: 'RETURN', label: 'Chiều về (người mua → shop)' },
]

export const directionLabel = (direction) =>
  direction === 'RETURN' ? 'Chiều về' : 'Chiều đi'

export const createdByLabel = (createdBy) =>
  createdBy === 'BUYER' ? 'Người mua tạo đơn' : 'Shop tạo đơn'

/** Ai chịu phí: chiều đi do người mua đã trả khi đặt hàng; chiều về trích từ quỹ ký quỹ shop khi người mua thắng. */
export const payerLabel = (record) => {
  if (record?.payer === 'SHOP_FUND') {
    return record.deductedFromShopFund ? 'Đã trích quỹ ký quỹ shop' : 'Quỹ ký quỹ shop (chờ phán quyết)'
  }
  return 'Người mua đã trả'
}
