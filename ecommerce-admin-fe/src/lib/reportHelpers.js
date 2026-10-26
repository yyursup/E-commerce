/**
 * Helper xác định một yêu cầu báo cáo/khiếu nại có thuộc luồng Khiếu nại kiện hoàn từ Shop hay không (Giai đoạn 2).
 * Phục vụ hiển thị nút bấm, tiêu đề và phân luồng phán quyết của Quản trị viên.
 *
 * @param {Object} item Bản ghi báo cáo vi phạm từ API
 * @returns {boolean} true nếu là khiếu nại kiện hoàn từ Shop
 */
export const isSellerReturnDisputeItem = (item) => {
  if (!item) return false
  const detail = item.detail || {}
  const orderReturn = item.orderReturn || detail.orderReturn || {}

  return Boolean(
    item.isSellerReturnDispute ||
    item.orderReturnStatus === 'DISPUTED' ||
    orderReturn.status === 'DISPUTED' ||
    Boolean(item.conditionStatus) ||
    Boolean(orderReturn.conditionStatus) ||
    item.targetInfo?.includes('DISPUTED') ||
    detail.targetInfo?.includes('DISPUTED') ||
    item.escalationReason?.includes('kiện hàng hoàn') ||
    detail.escalationReason?.includes('kiện hàng hoàn') ||
    item.description?.includes('kiện hàng hoàn') ||
    item.description?.includes('Shop khiếu nại') ||
    detail.description?.includes('kiện hàng hoàn') ||
    detail.description?.includes('Shop khiếu nại')
  )
}
