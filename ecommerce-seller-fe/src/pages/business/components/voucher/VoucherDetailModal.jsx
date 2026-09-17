import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineX,
  HiOutlineTicket,
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlineCheck,
  HiOutlineClipboardCopy,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineSparkles,
} from 'react-icons/hi'
import { useThemeStore } from '../../../../store/useThemeStore'
import { cn } from '../../../../lib/cn'
import toast from 'react-hot-toast'

export default function VoucherDetailModal({
  voucher,
  onClose,
}) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [copiedCode, setCopiedCode] = useState(false)

  if (!voucher) return null

  const handleCopyCode = () => {
    if (!voucher.code) return
    navigator.clipboard.writeText(voucher.code)
    setCopiedCode(true)
    toast.success(`Đã sao chép mã voucher: ${voucher.code}`)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không giới hạn'
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const isExpired = voucher.endDate && new Date(voucher.endDate) < new Date()
  const statusLabel = isExpired ? 'Hết hạn' : voucher.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'

  const usageLimit = voucher.usageLimit ? Number(voucher.usageLimit) : null
  const usedCount = Number(voucher.usedCount || 0)
  const usagePercent = usageLimit ? Math.min(100, Math.round((usedCount / usageLimit) * 100)) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl flex flex-col',
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-6 py-4 border-b shrink-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-100 bg-stone-50/80'
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-2xl shrink-0',
              isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-600'
            )}>
              <HiOutlineTicket className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">
                Chi Tiết Mã Giảm Giá
              </h2>
              <p className={cn('text-xs truncate', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Phạm vi: <span className="font-bold text-amber-500">Toàn Gian Hàng</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 border',
                statusLabel === 'Đang hoạt động'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : statusLabel === 'Hết hạn'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  statusLabel === 'Đang hoạt động' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                )}
              />
              {statusLabel}
            </span>

            <button
              type="button"
              onClick={onClose}
              className={cn(
                'rounded-xl p-2 transition-all active:scale-95',
                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100'
              )}
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Main Voucher Code Box */}
          <div className={cn(
            'rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden',
            isDark
              ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900'
              : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/30'
          )}>
            <div className="space-y-1">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-amber-400' : 'text-amber-700')}>
                Mã giảm giá shop
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-black tracking-widest text-amber-500">
                  {voucher.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={cn(
                    'p-1.5 rounded-xl border transition-all active:scale-95',
                    isDark
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                      : 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200'
                  )}
                  title="Sao chép mã"
                >
                  {copiedCode ? <HiOutlineCheck className="h-4 w-4 text-emerald-500" /> : <HiOutlineClipboardCopy className="h-4 w-4" />}
                </button>
              </div>
              <h3 className="font-bold text-sm sm:text-base pt-1">
                {voucher.title}
              </h3>
            </div>

            {/* Big Discount Value */}
            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-500/20">
              <span className="text-xs text-stone-400 block">Ưu đãi áp dụng:</span>
              <span className="text-xl sm:text-2xl font-black text-rose-500">
                {voucher.voucherType === 'PERCENTAGE'
                  ? `Giảm ${voucher.discountValue}%`
                  : voucher.voucherType === 'FREE_SHIPPING'
                  ? 'Miễn phí vận chuyển'
                  : formatVND(voucher.discountValue)}
              </span>
              {voucher.maxDiscountAmount && voucher.voucherType === 'PERCENTAGE' && (
                <span className={cn('text-xs block font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Tối đa: {formatVND(voucher.maxDiscountAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={cn('rounded-2xl p-4 border space-y-1', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/60')}>
              <span className={cn('text-xs flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                <HiOutlineTag className="h-4 w-4 text-amber-500" /> Đơn hàng tối thiểu:
              </span>
              <p className="font-bold text-sm sm:text-base">
                {voucher.minOrderValue ? formatVND(voucher.minOrderValue) : '0₫ (Không yêu cầu)'}
              </p>
            </div>

            <div className={cn('rounded-2xl p-4 border space-y-1', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/60')}>
              <span className={cn('text-xs flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                <HiOutlineUserGroup className="h-4 w-4 text-blue-500" /> Giới hạn mỗi khách hàng:
              </span>
              <p className="font-bold text-sm sm:text-base">
                {voucher.limitPerUser ? `${voucher.limitPerUser} lượt / tài khoản` : '1 lượt / tài khoản (Mặc định)'}
              </p>
            </div>
          </div>

          {/* Usage & Budget Stats */}
          <div className={cn('rounded-2xl p-4 border space-y-2.5', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/60')}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <HiOutlineSparkles className="h-4 w-4 text-amber-500" /> Lượt sử dụng thực tế:
              </span>
              <span className={isDark ? 'text-slate-200' : 'text-stone-800'}>
                {usedCount} / {usageLimit ? `${usageLimit} lượt` : 'Vô hạn'} ({usagePercent}%)
              </span>
            </div>

            {usageLimit && (
              <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Timeline Information */}
          <div className={cn('rounded-2xl p-4 border space-y-2', isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/60')}>
            <span className={cn('text-xs font-bold uppercase tracking-wider flex items-center gap-1.5', isDark ? 'text-slate-300' : 'text-stone-700')}>
              <HiOutlineCalendar className="h-4 w-4 text-emerald-500" /> Thời gian hiệu lực
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Bắt đầu từ:</span>
                <p className="font-semibold text-sm mt-0.5">{formatDate(voucher.startDate)}</p>
              </div>
              <div>
                <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Hết hạn lúc:</span>
                <p className={cn('font-semibold text-sm mt-0.5', isExpired ? 'text-rose-500' : '')}>
                  {formatDate(voucher.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Description & Terms */}
          {voucher.description && (
            <div className="space-y-1.5 border-t pt-3 dark:border-slate-800 border-stone-200">
              <h4 className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-300' : 'text-stone-700')}>
                Mô tả chương trình & Điều kiện áp dụng
              </h4>
              <p className={cn('text-xs sm:text-sm leading-relaxed whitespace-pre-wrap', isDark ? 'text-slate-300' : 'text-stone-600')}>
                {voucher.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-between gap-3 px-6 py-4 border-t shrink-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-100 bg-stone-50/80'
        )}>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all"
          >
            {copiedCode ? <HiOutlineCheck className="h-4 w-4" /> : <HiOutlineClipboardCopy className="h-4 w-4" />}
            Sao chép mã voucher
          </button>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-xl px-5 py-2.5 text-xs font-bold border transition-all active:scale-95',
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-stone-300 text-stone-700 hover:bg-stone-100'
            )}
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  )
}
