import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi'
import { cn } from '../../../../lib/cn'
import {
  formatAdminOrderCurrency,
  formatAdminOrderDate,
  getAdminOrderStatusBadge,
  getAdminOrderStatusLabel,
} from './orderHelpers'

export default function AdminOrderDetailCard({ order, isDark }) {
  const statusBadge = getAdminOrderStatusBadge(order.status)
  const StatusIcon = statusBadge.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border', isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white')}
    >
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Don hang {order.orderNumber}
            </h1>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Dat ngay {formatAdminOrderDate(order.createdAt)}
            </p>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Shop: {order.shopName} | Khach hang: {order.userName}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
              statusBadge.color,
            )}
          >
            <StatusIcon className="h-4 w-4" />
            {getAdminOrderStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="border-b p-6">
        <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
          Dia chi giao hang
        </h2>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <HiOutlineLocationMarker className={cn('mt-0.5 h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
            <div>
              <p className={cn('font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                {order.shippingName}
              </p>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {order.shippingAddress}
              </p>
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                {order.shippingWard}, {order.shippingDistrict}, {order.shippingCity}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HiOutlinePhone className={cn('h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              {order.shippingPhone}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b p-6">
        <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
          San pham
        </h2>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img
                src={item.productImageUrl || '/product-placeholder.svg'}
                alt={item.productName}
                className="h-20 w-20 rounded-lg bg-stone-100 object-cover dark:bg-slate-800"
                onError={(e) => {
                  e.target.src = '/product-placeholder.svg'
                }}
              />
              <div className="flex-1">
                <Link
                  to={`/products/${item.productId}`}
                  className={cn('font-medium hover:underline', isDark ? 'text-white' : 'text-stone-900')}
                >
                  {item.productName}
                </Link>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  So luong: {item.quantity}
                </p>
                <p className={cn('mt-1 text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatAdminOrderCurrency(item.totalPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Tam tinh
            </span>
            <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
              {formatAdminOrderCurrency(order.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Phi van chuyen
            </span>
            <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
              {formatAdminOrderCurrency(order.shippingFee || 0)}
            </span>
          </div>
          {order.ghnOrderCode && (
            <div className="flex justify-between">
              <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Ma van don GHN
              </span>
              <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                {order.ghnOrderCode}
              </span>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                Tong cong
              </span>
              <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                {formatAdminOrderCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
