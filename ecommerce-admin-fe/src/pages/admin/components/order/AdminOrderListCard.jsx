import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../../../lib/cn'
import {
  formatAdminOrderCurrency,
  formatAdminOrderDate,
  getAdminOrderStatusBadge,
  getAdminOrderStatusLabel,
} from './orderHelpers'

export default function AdminOrderListCard({ order, isDark }) {
  const statusBadge = getAdminOrderStatusBadge(order.status)
  const StatusIcon = statusBadge.icon
  const thumbnailImage = order.items?.[0]?.productImageUrl

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-6 transition-shadow hover:shadow-lg',
        isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
      )}
    >
      <Link to={`/orders/${order.id}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            {thumbnailImage && (
              <img
                src={thumbnailImage}
                alt={order.items[0]?.productName}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                  {order.orderNumber}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    statusBadge.color,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {getAdminOrderStatusLabel(order.status)}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-bold border',
                    order.paymentMethod === 'VNPAY'
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {order.paymentMethod === 'VNPAY' ? 'VNPAY' : 'COD'}
                </span>
              </div>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Shop: {order.shopName} | Khách hàng: {order.userName}
              </p>
              {order.items?.[0] && (order.items[0].variantColor || order.items[0].variantSize) && (
                <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
                  Phân loại: {[order.items[0].variantColor, order.items[0].variantSize].filter(Boolean).join(' - ')}
                  {order.items.length > 1 ? ` (+${order.items.length - 1} sp)` : ''}
                </p>
              )}
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {order.items?.length || 0} sản phẩm
              </p>
              <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
                {formatAdminOrderDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              {formatAdminOrderCurrency(order.total)}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
              Tổng cộng
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
