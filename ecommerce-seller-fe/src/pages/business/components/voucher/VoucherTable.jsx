import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineTicket,
  HiOutlinePlus,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineEye,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'

export default function VoucherTable({
  vouchers,
  loading,
  isDark,
  search,
  onOpenCreateModal,
  onSelectVoucher,
}) {
  const [copiedCode, setCopiedCode] = useState('')

  const handleCopyCode = (code, e) => {
    e?.stopPropagation()
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Đã sao chép mã voucher: ${code}`)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const formatVND = (amt) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vô thời hạn'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className={cn(
        'rounded-3xl border py-20 text-center shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
        <p className={cn('mt-3 text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang tải danh sách voucher từ hệ thống...
        </p>
      </div>
    )
  }

  if (vouchers.length === 0) {
    return (
      <div className={cn(
        'rounded-3xl border py-16 text-center shadow-sm',
        isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
      )}>
        <HiOutlineTicket className={cn('mx-auto h-12 w-12 mb-2', isDark ? 'text-slate-600' : 'text-stone-300')} />
        <p className={cn('font-semibold text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
          {search ? 'Không tìm thấy voucher phù hợp với từ khóa' : 'Gian hàng chưa có mã giảm giá nào thuộc nhóm này'}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          {search ? (
            <button
              onClick={() => {}}
              className="text-xs font-bold text-amber-500 hover:underline"
            >
              Xem tất cả voucher
            </button>
          ) : (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
            >
              <HiOutlinePlus className="h-4 w-4" />
              Tạo voucher ngay
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {vouchers.map((v) => {
        const isExpired = v.endDate && new Date(v.endDate) < new Date()
        const statusLabel = isExpired ? 'Hết hạn' : v.status === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'
        const isCopied = copiedCode === v.code
        const usageLimit = v.usageLimit ? Number(v.usageLimit) : null
        const usedCount = Number(v.usedCount || 0)
        const usagePercent = usageLimit ? Math.min(100, Math.round((usedCount / usageLimit) * 100)) : 0

        const discountText =
          v.voucherType === 'PERCENTAGE'
            ? `Giảm ${v.discountValue}%`
            : v.voucherType === 'FREE_SHIPPING'
            ? 'FreeShip'
            : formatVND(v.discountValue)

        return (
          <motion.div
            key={v.id || v.code}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelectVoucher?.(v)}
            className={cn(
              'group rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 relative',
              isDark
                ? 'border-slate-800 bg-slate-900 hover:border-amber-500/50 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-amber-500/5'
                : 'border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-md'
            )}
            title="Nhấp để xem chi tiết mã giảm giá"
          >
            {/* Left: Icon Badge & Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Type Icon */}
              <div
                className={cn(
                  'h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border shrink-0 flex flex-col items-center justify-center transition-transform duration-200 group-hover:scale-105',
                  v.voucherType === 'PERCENTAGE'
                    ? isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-600'
                    : v.voucherType === 'FREE_SHIPPING'
                    ? isDark ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-blue-200 bg-blue-50 text-blue-600'
                    : isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-600'
                )}
              >
                <HiOutlineTicket className="h-6 w-6 sm:h-7 sm:w-7" />
                <span className="text-[10px] font-black uppercase mt-0.5">
                  {v.voucherType === 'PERCENTAGE' ? '%' : v.voucherType === 'FREE_SHIPPING' ? 'SHIP' : 'VNĐ'}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Badge */}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide shrink-0 border',
                      statusLabel === 'Đang chạy'
                        ? isDark
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        statusLabel === 'Đang chạy' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                      )}
                    />
                    {statusLabel}
                  </span>

                  {/* Code Pill */}
                  <div
                    onClick={(e) => handleCopyCode(v.code, e)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-mono font-black text-xs uppercase tracking-wider transition-all active:scale-95',
                      isDark
                        ? 'border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                        : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    )}
                    title="Nhấp để sao chép mã"
                  >
                    <span>{v.code}</span>
                    {isCopied ? (
                      <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <HiOutlineClipboardCopy className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </div>

                  {/* Min Order Badge */}
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-lg border shrink-0',
                    isDark ? 'border-slate-800 bg-slate-800/60 text-slate-300' : 'border-stone-200 bg-stone-50 text-stone-600'
                  )}>
                    Đơn từ: <strong>{v.minOrderValue ? formatVND(v.minOrderValue) : '0₫'}</strong>
                  </span>
                </div>

                <h3 className={cn(
                  'font-bold text-sm sm:text-base leading-snug break-words group-hover:text-amber-500 transition-colors',
                  isDark ? 'text-white' : 'text-stone-900'
                )}>
                  {v.title}
                </h3>

                {/* Progress & Validity Dates */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className={cn('flex items-center gap-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    <HiOutlineSparkles className="h-3.5 w-3.5 text-amber-500" />
                    Đã dùng: <strong className={isDark ? 'text-slate-200' : 'text-stone-800'}>{usedCount}</strong> / {usageLimit ? `${usageLimit}` : 'Vô hạn'}
                  </span>

                  <span className={cn('flex items-center gap-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    <HiOutlineCalendar className="h-3.5 w-3.5 text-emerald-500" />
                    HSD: {formatDate(v.startDate)} → {formatDate(v.endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Discount Value & Action Buttons */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-slate-800 shrink-0">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-stone-400 block md:hidden">Mức ưu đãi:</span>
                <span className={cn(
                  'font-black text-base sm:text-lg',
                  v.voucherType === 'PERCENTAGE'
                    ? 'text-rose-500'
                    : v.voucherType === 'FREE_SHIPPING'
                    ? 'text-blue-500'
                    : isDark ? 'text-amber-400' : 'text-amber-600'
                )}>
                  {discountText}
                </span>
                {v.maxDiscountAmount && v.voucherType === 'PERCENTAGE' && (
                  <span className={cn('block text-[11px] font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Tối đa {formatVND(v.maxDiscountAmount)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(v.code, e)}
                  className={cn(
                    'p-2 rounded-xl border transition-all active:scale-95',
                    isDark
                      ? 'border-slate-800 bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:text-amber-600 hover:border-amber-500/40'
                  )}
                  title="Sao chép mã voucher"
                >
                  {isCopied ? <HiOutlineCheck className="h-4 w-4 text-emerald-500" /> : <HiOutlineClipboardCopy className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectVoucher?.(v)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95',
                    isDark
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  )}
                  title="Xem chi tiết voucher"
                >
                  <HiOutlineEye className="h-4 w-4" />
                  <span>Chi tiết</span>
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
