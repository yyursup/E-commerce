import { cn } from '../../../../lib/cn'

const ORDER_STATUS_MAP = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang chuẩn bị hàng',
  SHIPPING: 'Đang vận chuyển',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
}

const RETURN_STATUS_MAP = {
  WAITING_FOR_SHIPMENT: 'Chờ khách gửi hàng',
  SHIPPED: 'Đang chuyển hoàn',
  RETURNED: 'Kiện hoàn đã tới Shop',
  DISPUTED: 'Shop khiếu nại kiện hoàn',
  COMPLETED: 'Đã hoàn tất đổi trả',
  CANCELLED: 'Đã hủy đổi trả',
}

const CONDITION_STATUS_MAP = {
  GOOD: 'Hàng nguyên vẹn',
  DAMAGED: 'Hàng bị hư hỏng / bể vỡ',
  WRONG_ITEM: 'Giao sai hàng / tráo hàng',
  MISSING_PARTS: 'Thiếu linh kiện / phụ kiện',
}

const PAYMENT_METHOD_MAP = {
  WALLET: 'Ví Marketplace',
  VNPAY: 'VNPay',
}

export const renderTargetChips = (targetInfo, isDark) => {
  if (!targetInfo) return null

  if (targetInfo.includes('|')) {
    const parts = targetInfo.split('|').map((p) => p.trim()).filter(Boolean)
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {parts.map((part, index) => {
          const colonIndex = part.indexOf(':')
          if (colonIndex === -1) {
            return (
              <span
                key={index}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-xs font-medium border',
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                )}
              >
                {part}
              </span>
            )
          }

          const label = part.substring(0, colonIndex).trim()
          let rawValue = part.substring(colonIndex + 1).trim()
          let displayValue = rawValue

          const isPrice = label.toLowerCase().includes('tiền') || rawValue.endsWith('đ') || rawValue.endsWith('₫')
          if (isPrice) {
            const numericPart = rawValue.replace(/đ|₫|VND/gi, '').trim()
            const parsed = parseFloat(numericPart)
            if (!isNaN(parsed)) {
              displayValue = new Intl.NumberFormat('vi-VN').format(parsed) + ' đ'
            }
          }

          const isStatus = label.toLowerCase().includes('trạng thái')
          if (isStatus) {
            displayValue = ORDER_STATUS_MAP[rawValue.toUpperCase()] || rawValue
          }

          const isPayment = label.toLowerCase().includes('pttt') || label.toLowerCase().includes('thanh toán')
          if (isPayment) {
            displayValue = PAYMENT_METHOD_MAP[rawValue.toUpperCase()] || rawValue
          }

          const isReturn = label.toLowerCase().includes('hoàn') || label.toLowerCase().includes('kiện')
          if (isReturn) {
            if (rawValue.includes('(')) {
              const [mainPart, condPart] = rawValue.split('(')
              const cleanMain = mainPart.trim().toUpperCase()
              const cleanCond = condPart.replace(')', '').trim().toUpperCase()
              const translatedMain = RETURN_STATUS_MAP[cleanMain] || mainPart.trim()
              const translatedCond = CONDITION_STATUS_MAP[cleanCond] || cleanCond
              displayValue = `${translatedMain} (${translatedCond})`
            } else {
              displayValue = RETURN_STATUS_MAP[rawValue.toUpperCase()] || rawValue
            }
          }

          const isViolation = label.toLowerCase().includes('vi phạm') || label.toLowerCase().includes('kỷ luật')
          const isRating = label.toLowerCase().includes('đánh giá') || rawValue.includes('★') || rawValue.includes('sao')
          const isCategory = label.toLowerCase().includes('danh mục')
          const isQuantity = label.toLowerCase().includes('tồn kho') || label.toLowerCase().includes('kho') || label.toLowerCase().includes('đã bán')

          return (
            <div
              key={index}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border shadow-xs transition-all',
                isPrice
                  ? (isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 font-bold' : 'bg-rose-50 border-rose-200 text-rose-700 font-bold')
                  : isStatus
                    ? (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold' : 'bg-amber-50 border-amber-200 text-amber-700 font-bold')
                    : isViolation
                      ? (isDark ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 font-bold' : 'bg-rose-100/70 border-rose-300 text-rose-800 font-bold')
                      : isRating
                        ? (isDark ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold' : 'bg-amber-50 border-amber-200 text-amber-700 font-semibold')
                        : isCategory
                          ? (isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-semibold' : 'bg-cyan-50 border-cyan-200 text-cyan-700 font-semibold')
                          : isQuantity
                            ? (isDark ? 'bg-teal-500/10 border-teal-500/30 text-teal-300 font-semibold' : 'bg-teal-50 border-teal-200 text-teal-700 font-semibold')
                            : isPayment
                              ? (isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 font-semibold' : 'bg-blue-50 border-blue-200 text-blue-700 font-semibold')
                              : isReturn
                                ? (isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-semibold' : 'bg-purple-50 border-purple-200 text-purple-700 font-semibold')
                                : (isDark ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' : 'bg-stone-50 border-stone-200 text-stone-700')
              )}
            >
              <span className="text-stone-400 dark:text-slate-400 font-normal">{label}:</span>
              <span className={cn('font-semibold', isPrice && 'font-mono text-xs sm:text-sm tracking-tight')}>{displayValue}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const formattedText = targetInfo.replace(/(\d+(?:\.\d+)?)\s*(?:đ|₫)/g, (match, p1) => {
    const parsed = parseFloat(p1)
    return isNaN(parsed) ? match : new Intl.NumberFormat('vi-VN').format(parsed) + ' đ'
  })

  return (
    <span className="text-xs font-medium text-stone-700 dark:text-slate-300">
      {formattedText}
    </span>
  )
}

export default function AdminReportTargetInfo({
  detail,
  isDark,
  getTargetIcon,
  getTargetLabel,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 space-y-2.5 transition-all',
        isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/80',
      )}
    >
      <div className="flex items-center gap-2">
        {getTargetIcon && getTargetIcon(detail?.targetType)}
        <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
          Đối tượng liên quan: {getTargetLabel ? getTargetLabel(detail?.targetType) : detail?.targetType}
        </span>
      </div>

      {detail ? (
        <div className="space-y-2 pt-0.5">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px] shrink-0">
              Tên đối tượng:
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-white">
              {detail.targetName || 'Chưa có thông tin'}
            </span>
          </div>

          {detail.targetInfo && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 pt-0.5">
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 min-w-[100px] shrink-0 pt-1">
                Thông tin bổ sung:
              </span>
              <div className="flex-1">
                {renderTargetChips(detail.targetInfo, isDark)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-stone-500 dark:text-slate-400 italic">
          Không tìm thấy thông tin đối tượng chi tiết trong hồ sơ.
        </p>
      )}
    </div>
  )
}
