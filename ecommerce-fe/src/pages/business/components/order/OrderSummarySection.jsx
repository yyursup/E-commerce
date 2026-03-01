import { cn } from '../../../../lib/cn'
import { formatCurrency } from './orderHelpers'

export default function OrderSummarySection({ order, isDark }) {
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
      </div>
    </div>
  )
}
