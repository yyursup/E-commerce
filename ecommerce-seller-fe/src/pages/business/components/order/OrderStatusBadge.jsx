import { cn } from '../../../../lib/cn'
import { getOrderStatusBadge, getOrderStatusLabel } from './orderHelpers'
import {
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi'

const RETURN_BADGE_MAP = {
  WAITING_FOR_SHIPMENT: {
    label: 'Chờ người mua gửi hàng',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
    icon: HiOutlineClock,
  },
  SHIPPED: {
    label: 'Đang giao hàng hoàn',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
    icon: HiOutlineTruck,
  },
  RETURNED: {
    label: 'Đã giao hàng hoàn',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
    icon: HiOutlineCheckCircle,
  },
  DISPUTED: {
    label: 'Shop khiếu nại đơn hoàn',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-300 dark:border-rose-700',
    icon: HiOutlineExclamationCircle,
  },
  COMPLETED: {
    label: 'Đã hoàn tiền',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
    icon: HiOutlineCheckCircle,
  },
  CANCELLED: {
    label: 'Đã hủy trả hàng',
    color: 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-300 dark:border-slate-700',
    icon: HiOutlineXCircle,
  },
}

export default function OrderStatusBadge({ status, returnInfo, className }) {
  if (returnInfo && returnInfo.status) {
    const returnConfig = RETURN_BADGE_MAP[returnInfo.status]
    if (returnConfig) {
      const ReturnIcon = returnConfig.icon
      // Dynamic label for COMPLETED based on settlement data
      let label = returnConfig.label
      if (returnInfo.status === 'COMPLETED' && returnInfo.settlement?.settlementType) {
        const s = returnInfo.settlement
        if (s.settlementType === 'PARTIAL_SPLIT') {
          label = `Chia tiền: Khách ${s.buyerPercentage}% — Shop ${s.sellerPercentage}%`
        } else if (s.settlementType === 'FULL_RELEASE') {
          label = 'Giải ngân cho Shop'
        } else if (s.settlementType === 'FULL_REFUND') {
          label = 'Hoàn tiền cho Khách'
        }
      }
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border',
            returnConfig.color,
            className,
          )}
        >
          <ReturnIcon className="h-3.5 w-3.5" />
          {label}
        </span>
      )
    }
  }

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
