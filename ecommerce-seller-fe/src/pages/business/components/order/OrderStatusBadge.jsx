import { cn } from '../../../../lib/cn'
import { getOrderEffectiveStatus } from './orderHelpers'

export default function OrderStatusBadge({ status, returnInfo, className }) {
  const effective = getOrderEffectiveStatus({ status }, returnInfo)
  const StatusIcon = effective.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border',
        effective.color,
        className,
      )}
    >
      <StatusIcon className="h-3.5 w-3.5" />
      {effective.label}
    </span>
  )
}
