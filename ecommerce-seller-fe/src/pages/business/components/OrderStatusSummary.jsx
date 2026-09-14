import { cn } from '../../../lib/cn'
import {
  ORDER_STATUSES,
  getOrderStatusBadge,
  getOrderStatusLabel,
} from '../../../lib/orderStatus'

const DASHBOARD_ORDER_STATUSES = ORDER_STATUSES.filter((status) => Boolean(status.value))

const toStatusCount = (orderCountByStatus, statusKey) => {
  const parsedCount = Number(orderCountByStatus?.[statusKey])
  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0
}

export default function OrderStatusSummary({ isDark, orderCountByStatus, totalOrders }) {
  const statusItems = DASHBOARD_ORDER_STATUSES.map(({ value }) => ({
    status: value,
    label: getOrderStatusLabel(value),
    count: toStatusCount(orderCountByStatus, value),
    badge: getOrderStatusBadge(value),
  }))

  const totalByStatus = statusItems.reduce((sum, item) => sum + item.count, 0)
  const denominator = totalByStatus || 1
  const hasDifferentTotal = Number(totalOrders) !== totalByStatus

  return (
    <div
      className={cn(
        'mb-8 rounded-xl border p-6',
        isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={cn('text-xl font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
            Đơn hàng theo trạng thái
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Phân bố chi tiết trên từng trạng thái đơn hàng
          </p>
        </div>
        <div className="text-right">
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Tổng đơn hàng theo trạng thái:{' '}
            <span className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              {totalByStatus}
            </span>
          </p>
          {hasDifferentTotal && (
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
              Tổng đơn trong KPI: {Number(totalOrders) || 0}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statusItems.map((item) => {
          const StatusIcon = item.badge.icon
          const percentage = Math.round((item.count / denominator) * 100)
          const width = item.count === 0 ? 0 : Math.max(percentage, 4)

          return (
            <div
              key={item.status}
              className={cn(
                'rounded-lg border p-3',
                isDark ? 'border-slate-700 bg-slate-800/70' : 'border-stone-200 bg-stone-50',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                    item.badge.color,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {item.label}
                </span>
                <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                  {item.count}
                </span>
              </div>
              <div className={cn('h-1.5 w-full rounded-full', isDark ? 'bg-slate-700' : 'bg-stone-200')}>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isDark ? 'bg-amber-400' : 'bg-amber-500',
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {percentage}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
