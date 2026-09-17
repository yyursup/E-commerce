import { useState } from 'react'
import {
  HiOutlineCheck,
  HiOutlineTruck,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineClipboardCopy,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'

export default function SellerOrderActions({
  order,
  isDark,
  actionLoading,
  ghnOrderCodeInput,
  onGhnOrderCodeChange,
  onUpdateStatus,
  onRetryCreateGhn,
  onSetManualGhnCode,
}) {
  const [copiedGhn, setCopiedGhn] = useState(false)

  const isNoGhnCode = !order?.ghnOrderCode
  const canMoveToProcessing = order?.status === 'CONFIRMED'
  const canMoveToShipping = order?.status === 'PROCESSING'
  const canCancel = ['CONFIRMED', 'PROCESSING'].includes(order?.status)
  const canMarkDelivered = order?.status === 'SHIPPING'
  const canRetryGhn =
    ['CONFIRMED', 'PROCESSING', 'SHIPPING'].includes(order?.status) && isNoGhnCode

  const handleCopyGhn = () => {
    if (!order.ghnOrderCode) return
    navigator.clipboard.writeText(order.ghnOrderCode)
    setCopiedGhn(true)
    toast.success(`Đã sao chép mã GHN: ${order.ghnOrderCode}`)
    setTimeout(() => setCopiedGhn(false), 2000)
  }

  return (
    <div className="border-b border-stone-200 dark:border-slate-800 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
          Thao Tác & Xử Lý Đơn Hàng
        </h3>

        {order?.ghnOrderCode && (
          <button
            type="button"
            onClick={handleCopyGhn}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all',
              isDark
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            )}
          >
            <HiOutlineTruck className="h-4 w-4" />
            <span>Mã GHN: {order.ghnOrderCode}</span>
            {copiedGhn ? (
              <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <HiOutlineClipboardCopy className="h-4 w-4 opacity-70" />
            )}
          </button>
        )}
      </div>

      {order?.status === 'PENDING_PAYMENT' && (
        <div
          className={cn(
            'p-4 rounded-2xl border text-xs sm:text-sm',
            isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          ⏳ Đơn hàng đang ở trạng thái <strong>Chờ thanh toán</strong>. Khi khách thanh toán thành công, đơn sẽ tự động chuyển sang <strong>Đã xác nhận</strong> để shop đóng gói.
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-3">
        {canMoveToProcessing && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onUpdateStatus('PROCESSING')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
          >
            <HiOutlineCheck className="h-4 w-4" />
            <span>Xác Nhận & Bắt Đầu Đóng Gói (PROCESSING)</span>
          </button>
        )}

        {canMoveToShipping && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onUpdateStatus('SHIPPING')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <HiOutlineTruck className="h-4 w-4" />
            <span>Đã Giao Cho Shipper GHN (SHIPPING)</span>
          </button>
        )}

        {canMarkDelivered && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={async () => {
              if (window.confirm('Xác nhận đơn hàng đã giao thành công tới tay khách hàng?')) {
                await onUpdateStatus('DELIVERED')
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <HiOutlineCheckCircle className="h-4 w-4" />
            <span>Xác Nhận Đã Giao Thành Công (DELIVERED)</span>
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={async () => {
              if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này sẽ hoàn lại voucher và số lượng kho cho khách.')) {
                await onUpdateStatus('CANCELLED')
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all disabled:opacity-50"
          >
            <HiOutlineX className="h-4 w-4" />
            <span>Hủy Đơn Hàng</span>
          </button>
        )}
      </div>

      {/* GHN Retry & Manual Input */}
      {canRetryGhn && (
        <div
          className={cn(
            'rounded-2xl border p-4 sm:p-5 space-y-3',
            isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-200 bg-stone-50'
          )}
        >
          <div>
            <p className={cn('text-xs sm:text-sm font-bold', isDark ? 'text-amber-400' : 'text-amber-800')}>
              ⚠️ Đơn hàng chưa có mã vận đơn GHN Express
            </p>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Hệ thống có thể tự động tạo lại mã vận đơn qua API GHN hoặc bạn có thể nhập mã phiếu gửi hàng thủ công.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={actionLoading}
              onClick={onRetryCreateGhn}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              <HiOutlineRefresh className={cn('h-3.5 w-3.5', actionLoading && 'animate-spin')} />
              <span>Thử tạo đơn GHN tự động</span>
            </button>

            <span className="text-xs text-stone-400">hoặc</span>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ghnOrderCodeInput}
                onChange={(e) => onGhnOrderCodeChange(e.target.value)}
                placeholder="Nhập mã vận đơn GHN thủ công..."
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-mono outline-none transition-all w-52 sm:w-64 focus:ring-2 focus:ring-amber-500',
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400'
                )}
              />
              <button
                type="button"
                disabled={actionLoading || !ghnOrderCodeInput.trim()}
                onClick={onSetManualGhnCode}
                className="rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700 transition-all disabled:opacity-40"
              >
                Lưu mã GHN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
