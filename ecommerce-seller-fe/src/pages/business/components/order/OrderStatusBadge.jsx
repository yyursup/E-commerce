import { cn } from '../../../../lib/cn'
import { getOrderStatusBadge, getOrderStatusLabel } from './orderHelpers'

export default function OrderStatusBadge({ status, className }) {
  const statusBadge = getOrderStatusBadge(status)
  const StatusIcon = statusBadge.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        statusBadge.color,
        className,
      )}
    >
      <StatusIcon className="h-3 w-3" />
      {getOrderStatusLabel(status)}
    </span>
  )
}
