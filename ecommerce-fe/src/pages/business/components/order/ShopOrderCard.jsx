import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../../../lib/cn'
import OrderStatusBadge from './OrderStatusBadge'
import { formatCurrency, formatDate } from './orderHelpers'

export default function ShopOrderCard({ order, isDark }) {
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
      <Link to={`/business/orders/${order.id}`}>
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
              <div className="flex items-center gap-3">
                <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                  {order.orderNumber}
                </h3>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Khách hàng: {order.userName || '-'}
              </p>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {order.items?.length || 0} sản phẩm
              </p>
              <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              {formatCurrency(order.total)}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>Tổng cộng</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
