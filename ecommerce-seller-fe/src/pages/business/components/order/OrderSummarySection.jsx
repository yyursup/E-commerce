import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'
import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineClock,
} from 'react-icons/hi'

const ESCROW_HELD_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED']

export default function OrderSummarySection({ order, isDark }) {
  const showEscrowHeld = ESCROW_HELD_STATUSES.includes(order.status)
  const showEscrowDelivered = order.status === 'DELIVERED'
  const showEscrowCompleted = order.status === 'COMPLETED'

  return (
    <div className="p-6">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>Tạm tính</span>
          <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(order.subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Phí vận chuyển
          </span>
          <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
            {formatCurrency(order.shippingFee)}
          </span>
        </div>
        {order.platformCommission > 0 && (
          <div className="flex justify-between">
            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Hoa hồng nền tảng
            </span>
            <span className="text-sm font-medium text-rose-500">
              -{formatCurrency(order.platformCommission)}
            </span>
          </div>
        )}
        {order.ghnOrderCode && (
          <div className="flex justify-between">
            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Mã vận đơn GHN
            </span>
            <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
              {order.ghnOrderCode}
            </span>
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Tổng cộng
            </span>
            <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Escrow Status for Seller */}
        {(showEscrowHeld || showEscrowDelivered || showEscrowCompleted) && (
          <div className="border-t pt-4 mt-2">
            <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-slate-300' : 'text-stone-700')}>
              Trạng thái Escrow
            </h3>
            {showEscrowHeld && (
              <div className={cn('flex items-start gap-3 rounded-xl p-4', isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100')}>
                <div className="mt-0.5 p-2 rounded-full bg-amber-500/10 shrink-0">
                  <HiOutlineLockClosed className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-amber-400' : 'text-amber-700')}>
                    Tiền đang được giữ trong escrow
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Số tiền <span className="font-semibold">{formatCurrency(order.subtotal)}</span> sẽ được chuyển vào ví của bạn sau khi buyer xác nhận đã nhận hàng.
                  </p>
                </div>
              </div>
            )}
            {showEscrowDelivered && (
              <div className={cn('flex items-start gap-3 rounded-xl p-4', isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100')}>
                <div className="mt-0.5 p-2 rounded-full bg-blue-500/10 shrink-0">
                  <HiOutlineClock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-blue-400' : 'text-blue-700')}>
                    Chờ buyer xác nhận nhận hàng
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Tiền sẽ tự động được giải phóng vào ví của bạn sau <span className="font-semibold">3 ngày</span> nếu buyer không xác nhận.
                  </p>
                </div>
              </div>
            )}
            {showEscrowCompleted && (
              <div className={cn('flex items-start gap-3 rounded-xl p-4', isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-100')}>
                <div className="mt-0.5 p-2 rounded-full bg-emerald-500/10 shrink-0">
                  <HiOutlineShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    Escrow đã giải phóng – Tiền đã vào ví
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Tiền đã được chuyển vào ví của bạn (sau khi trừ hoa hồng nền tảng).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
