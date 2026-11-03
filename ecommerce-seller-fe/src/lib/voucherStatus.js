/**
 * Quy tắc nhận diện và nhãn hiển thị trạng thái Voucher Gian Hàng (Seller Portal).
 * 
 * Thứ tự ưu tiên bắt buộc:
 * DELETED > EXHAUSTED > EXPIRED > INACTIVE > UPCOMING > ACTIVE
 */

export const VOUCHER_STATUS_FILTER_OPTIONS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang chạy' },
  { key: 'UPCOMING', label: 'Sắp diễn ra' },
  { key: 'INACTIVE', label: 'Tạm dừng' },
  { key: 'EXHAUSTED', label: 'Hết lượt' },
  { key: 'EXPIRED', label: 'Hết hạn' },
  { key: 'DELETED', label: 'Đã hủy' },
]

/**
 * Xác định trạng thái hiển thị của Voucher.
 * 
 * @param {Object} voucher Bản ghi voucher từ API
 * @param {Date|string|number} [now=new Date()] Mốc thời gian đối soát (hỗ trợ kiểm thử ranh giới)
 * @returns {{ key: string, label: string }} Trạng thái hiển thị chuẩn hóa
 */
export function getVoucherDisplayStatus(voucher, now = new Date()) {
  if (!voucher) {
    return { key: 'UNKNOWN', label: 'Không xác định' }
  }

  const currentTime = now instanceof Date ? now : new Date(now)

  // 1. DELETED (Ưu tiên cao nhất)
  if (voucher.status === 'DELETED') {
    return { key: 'DELETED', label: 'Đã hủy' }
  }

  // 2. EXHAUSTED (Hết lượt: status = EXHAUSTED hoặc usedCount >= usageLimit)
  const hasUsageLimit = voucher.usageLimit !== null && voucher.usageLimit !== undefined
  const used = voucher.usedCount != null ? Number(voucher.usedCount) : 0
  const isExhaustedByCount = hasUsageLimit && used >= Number(voucher.usageLimit)
  if (voucher.status === 'EXHAUSTED' || isExhaustedByCount) {
    return { key: 'EXHAUSTED', label: 'Hết lượt' }
  }

  // 3. EXPIRED (Hết hạn: status = EXPIRED hoặc endDate < now)
  const hasEndDate = voucher.endDate !== null && voucher.endDate !== undefined && voucher.endDate !== ''
  const isExpiredByDate = hasEndDate && new Date(voucher.endDate) < currentTime
  if (voucher.status === 'EXPIRED' || isExpiredByDate) {
    return { key: 'EXPIRED', label: 'Hết hạn' }
  }

  // 4. INACTIVE (Ưu tiên trước UPCOMING: ví dụ Shop đóng cửa chuyển voucher sang INACTIVE)
  if (voucher.status === 'INACTIVE') {
    return { key: 'INACTIVE', label: 'Tạm dừng' }
  }

  // 5. UPCOMING (Chưa bắt đầu: startDate > now, chỉ xét khi không thuộc các trạng thái trên)
  const hasStartDate = voucher.startDate !== null && voucher.startDate !== undefined && voucher.startDate !== ''
  const isUpcomingByDate = hasStartDate && new Date(voucher.startDate) > currentTime
  if (isUpcomingByDate) {
    return { key: 'UPCOMING', label: 'Sắp diễn ra' }
  }

  // 6. ACTIVE (Đang có hiệu lực)
  if (voucher.status === 'ACTIVE') {
    return { key: 'ACTIVE', label: 'Đang chạy' }
  }

  // 7. Fallback an toàn nếu gặp status không xác định
  return {
    key: 'UNKNOWN',
    label: voucher.status ? String(voucher.status) : 'Không xác định',
  }
}

/**
 * Trả về styling class cho badge trạng thái tương thích Dark/Light mode.
 * 
 * @param {string} statusKey Key trạng thái ('ACTIVE' | 'UPCOMING' | 'INACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'DELETED')
 * @param {boolean} isDark Theme dark/light
 * @returns {{ badgeClass: string, dotClass: string }}
 */
export function getVoucherBadgeConfig(statusKey, isDark) {
  switch (statusKey) {
    case 'ACTIVE':
      return {
        badgeClass: isDark
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dotClass: 'bg-emerald-500 animate-pulse',
      }
    case 'UPCOMING':
      return {
        badgeClass: isDark
          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
          : 'bg-blue-50 text-blue-700 border border-blue-200',
        dotClass: 'bg-blue-500',
      }
    case 'INACTIVE':
      return {
        badgeClass: isDark
          ? 'bg-slate-800 text-slate-400 border border-slate-700'
          : 'bg-stone-100 text-stone-600 border border-stone-200',
        dotClass: 'bg-stone-400',
      }
    case 'EXHAUSTED':
      return {
        badgeClass: isDark
          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border border-amber-200',
        dotClass: 'bg-amber-500',
      }
    case 'EXPIRED':
      return {
        badgeClass: isDark
          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border border-rose-200',
        dotClass: 'bg-rose-500',
      }
    case 'DELETED':
      return {
        badgeClass: isDark
          ? 'bg-stone-800/80 text-stone-400 border border-stone-700'
          : 'bg-stone-200/80 text-stone-600 border border-stone-300',
        dotClass: 'bg-stone-500',
      }
    default:
      return {
        badgeClass: isDark
          ? 'bg-slate-800 text-slate-400 border border-slate-700'
          : 'bg-stone-100 text-stone-600 border border-stone-200',
        dotClass: 'bg-stone-400',
      }
  }
}

/**
 * Kiểm tra điều kiện cho phép Seller chỉnh sửa Voucher.
 *
 * Điều kiện bắt buộc:
 * 1. voucher.status === 'ACTIVE'
 * 2. startDate tồn tại và > now (chưa bắt đầu)
 * 3. Shop chưa đóng cửa (!isShopClosed)
 * 4. Không hết hạn (endDate > now nếu có) và không hết lượt (usedCount < usageLimit nếu có)
 *
 * @param {Object} voucher Bản ghi voucher
 * @param {boolean} [isShopClosed=false] Trạng thái gian hàng đóng cửa
 * @param {Date|string|number} [now=new Date()] Mốc thời gian đối soát
 * @returns {boolean} true nếu thỏa mãn toàn bộ điều kiện chỉnh sửa
 */
export function canEditVoucher(voucher, isShopClosed = false, now = new Date()) {
  if (!voucher || isShopClosed) return false

  // 1. Phải là ACTIVE ở trạng thái DB
  if (voucher.status !== 'ACTIVE') return false

  // 2. startDate phải tồn tại và > now (chưa bắt đầu)
  if (!voucher.startDate) return false

  const currentTime = now instanceof Date ? now : new Date(now)
  const startDate = new Date(voucher.startDate)
  if (isNaN(startDate.getTime()) || startDate <= currentTime) return false

  // 3. Phải không bị hết hạn hoặc hết lượt
  if (voucher.endDate && new Date(voucher.endDate) <= currentTime) return false
  if (voucher.usageLimit !== null && voucher.usageLimit !== undefined) {
    const used = voucher.usedCount != null ? Number(voucher.usedCount) : 0
    if (used >= Number(voucher.usageLimit)) return false
  }

  return true
}

