import { motion } from 'framer-motion'
import {
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineTicket,
} from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import {
  isVoucherStarted,
  getVoucherDisplayStatus,
  getVoucherBadgeConfig,
} from '../../../../lib/voucherStatus'

export default function DeleteVoucherConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  voucher,
  loading = false,
  isDark = false,
}) {
  if (!isOpen || !voucher) return null

  const isStarted = isVoucherStarted(voucher)
  const displayStatus = getVoucherDisplayStatus(voucher)
  const badgeConfig = getVoucherBadgeConfig(displayStatus.key, isDark)

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không giới hạn'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl flex flex-col',
          isDark ? 'border-slate-800 bg-slate-900 text-white' : 'border-stone-200 bg-white text-stone-900'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-6 py-4 border-b shrink-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-100 bg-stone-50/80'
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-2xl shrink-0',
              isStarted
                ? isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'
                : isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-600'
            )}>
              {isStarted ? (
                <HiOutlineExclamation className="h-5 w-5" />
              ) : (
                <HiOutlineTrash className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isStarted ? 'Kết thúc sớm Voucher?' : 'Xóa Voucher chưa bắt đầu?'}
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Xác nhận thao tác quản lý voucher
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={cn(
              'rounded-xl p-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-stone-500 hover:bg-stone-100'
            )}
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Notice Banner */}
          <div className={cn(
            'rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed',
            isStarted
              ? isDark
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-amber-200 bg-amber-50 text-amber-800'
              : isDark
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-800'
          )}>
            {isStarted ? (
              <p>
                Voucher này sẽ được kết thúc sớm và chuyển sang trạng thái <strong>Tạm dừng (INACTIVE)</strong>. Lịch sử sử dụng Voucher vẫn được giữ nguyên.
              </p>
            ) : (
              <p>
                Voucher này sẽ được chuyển sang trạng thái <strong>Đã hủy</strong>. Sau khi thực hiện, Voucher không thể được sử dụng hoặc thao tác lại.
              </p>
            )}
          </div>

          {/* Voucher Summary Card */}
          <div className={cn(
            'rounded-2xl p-4 border space-y-2',
            isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50/70'
          )}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base font-black text-amber-500">
                {voucher.code}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide shrink-0 border',
                  badgeConfig.badgeClass
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    badgeConfig.dotClass
                  )}
                />
                {displayStatus.label}
              </span>
            </div>

            <h3 className={cn('text-sm font-bold line-clamp-2', isDark ? 'text-white' : 'text-stone-900')}>
              {voucher.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 pt-1">
              <HiOutlineCalendar className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                Hiệu lực: {formatDate(voucher.startDate)} → {formatDate(voucher.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-100 bg-stone-50/80'
        )}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={cn(
              'rounded-xl px-4 py-2.5 text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-stone-300 text-stone-700 hover:bg-stone-100'
            )}
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm?.(voucher)}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
              isStarted
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
            )}
          >
            {loading && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
            )}
            {isStarted ? 'Xác nhận kết thúc sớm' : 'Xác nhận xóa'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
