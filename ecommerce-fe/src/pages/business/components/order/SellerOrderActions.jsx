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
  const isNoGhnCode = !order?.ghnOrderCode
  const canMoveToProcessing = order?.status === 'CONFIRMED'
  const canMoveToShipping = order?.status === 'PROCESSING'
  const canCancel = order?.status === 'CONFIRMED'
  const canMarkDelivered = order?.status === 'SHIPPING'
  const canRetryGhn =
    ['CONFIRMED', 'PROCESSING', 'SHIPPING'].includes(order?.status) && isNoGhnCode

  return (
    <div className="border-b p-6">
      <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
        Hành động người bán
      </h2>

      {order?.status === 'PENDING_PAYMENT' && (
        <p className={cn('mb-3 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
          Đơn hàng đang chờ người mua thanh toán.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canMoveToProcessing && (
          <button
            disabled={actionLoading}
            onClick={() => onUpdateStatus('PROCESSING')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
              actionLoading ? 'cursor-not-allowed bg-amber-400/70' : 'bg-amber-500 hover:bg-amber-600',
            )}
          >
            Chuyển sang xử lý
          </button>
        )}

        {canMoveToShipping && (
          <button
            disabled={actionLoading}
            onClick={() => onUpdateStatus('SHIPPING')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
              actionLoading ? 'cursor-not-allowed bg-blue-400/70' : 'bg-blue-500 hover:bg-blue-600',
            )}
          >
            Chuyển sang giao hàng
          </button>
        )}

        {canMarkDelivered && (
          <button
            disabled={actionLoading}
            onClick={async () => {
              if (!window.confirm('Xác nhận đơn hàng đã giao thành công?')) return
              await onUpdateStatus('DELIVERED')
            }}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
              actionLoading ? 'cursor-not-allowed bg-green-400/70' : 'bg-green-500 hover:bg-green-600',
            )}
          >
            Xác nhận đã giao hàng
          </button>
        )}

        {canCancel && (
          <button
            disabled={actionLoading}
            onClick={async () => {
              if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return
              await onUpdateStatus('CANCELLED')
            }}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
              actionLoading ? 'cursor-not-allowed bg-red-400/70' : 'bg-red-500 hover:bg-red-600',
            )}
          >
            Hủy đơn
          </button>
        )}
      </div>

      {canRetryGhn && (
        <div
          className={cn(
            'mt-4 rounded-lg border p-4',
            isDark ? 'border-slate-700 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
          )}
        >
          <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
            Đơn chưa có mã GHN. Bạn có thể thử tạo lại hoặc nhập mã thủ công.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              disabled={actionLoading}
              onClick={onRetryCreateGhn}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                actionLoading ? 'cursor-not-allowed bg-indigo-400/70' : 'bg-indigo-500 hover:bg-indigo-600',
              )}
            >
              Thử tạo GHN lại
            </button>

            <input
              value={ghnOrderCodeInput}
              onChange={(e) => onGhnOrderCodeChange(e.target.value)}
              placeholder="Nhập mã GHN thủ công"
              className={cn(
                'w-64 rounded-lg border px-3 py-2 text-sm outline-none transition',
                isDark
                  ? 'border-slate-600 bg-slate-900 text-white focus:border-amber-500/60'
                  : 'border-stone-300 bg-white text-stone-900 focus:border-amber-500',
              )}
            />
            <button
              disabled={actionLoading}
              onClick={onSetManualGhnCode}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                actionLoading ? 'cursor-not-allowed bg-slate-500/70' : 'bg-slate-700 hover:bg-slate-800',
              )}
            >
              Lưu mã GHN
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
