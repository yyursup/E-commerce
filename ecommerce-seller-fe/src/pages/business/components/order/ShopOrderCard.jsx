import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineTruck,
  HiOutlineTag,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { cn } from '../../../../lib/cn'
import OrderStatusBadge from './OrderStatusBadge'
import { formatCurrency, formatDate } from './orderHelpers'

export default function ShopOrderCard({ order, isDark, onQuickStatusUpdate, actionLoading }) {
  const [copiedGhn, setCopiedGhn] = useState(false)

  const items = order.items || []
  const thumbnailImage = items[0]?.productImageUrl || '/product-placeholder.svg'

  const handleCopyGhn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!order.ghnOrderCode) return
    navigator.clipboard.writeText(order.ghnOrderCode)
    setCopiedGhn(true)
    toast.success(`Đã sao chép mã GHN: ${order.ghnOrderCode}`)
    setTimeout(() => setCopiedGhn(false), 2000)
  }

  // Quick Action conditions
  const canMoveToProcessing = order.status === 'CONFIRMED'
  const canMoveToShipping = order.status === 'PROCESSING'
  const canMarkDelivered = order.status === 'SHIPPING'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        'group rounded-2xl border transition-all duration-200 hover:shadow-lg overflow-hidden',
        isDark
          ? 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
          : 'border-stone-200 bg-white hover:border-stone-300 shadow-sm'
      )}
    >
      {/* 1. Header Bar: Order Number, Date, Status */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b',
          isDark ? 'border-slate-800 bg-slate-800/40' : 'border-stone-100 bg-stone-50/70'
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            to={`/orders/${order.id}`}
            className="font-mono font-bold text-sm text-amber-500 hover:underline tracking-tight"
          >
            {order.orderNumber}
          </Link>
          <span className="text-[11px] text-stone-400">•</span>
          <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            {formatDate(order.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {order.ghnOrderCode ? (
            <button
              type="button"
              onClick={handleCopyGhn}
              title="Nhấp để sao chép mã vận đơn GHN"
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all',
                isDark
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              )}
            >
              <HiOutlineTruck className="h-3.5 w-3.5" />
              <span>GHN: {order.ghnOrderCode}</span>
              {copiedGhn ? (
                <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <HiOutlineClipboardCopy className="h-3.5 w-3.5 opacity-60" />
              )}
            </button>
          ) : (
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium',
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-500'
              )}
            >
              Chưa có mã GHN
            </span>
          )}

          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* 2. Card Content: Product Previews & Customer Address */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left column: Products preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={thumbnailImage}
                alt={items[0]?.productName || 'Sản phẩm'}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-stone-200 dark:border-slate-800 bg-stone-100 dark:bg-slate-800"
                onError={(e) => {
                  e.target.src = '/product-placeholder.svg'
                }}
              />
              {items.length > 1 && (
                <span className="absolute -bottom-1 -right-1 flex h-5 px-1.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow">
                  +{items.length - 1}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  'text-sm font-semibold truncate',
                  isDark ? 'text-white' : 'text-stone-900'
                )}
                title={items[0]?.productName}
              >
                {items[0]?.productName || 'Sản phẩm'}
              </h4>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md font-medium',
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-700'
                  )}
                >
                  Số lượng: <strong>{items[0]?.quantity || 1}</strong>
                </span>
                <span className="text-stone-400">•</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(items[0]?.price || items[0]?.totalPrice || 0)}
                </span>
              </div>

              {items.length > 1 && (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400">
                  và {items.length - 1} sản phẩm khác trong đơn hàng
                </p>
              )}

              {/* Voucher Badges */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {order.shopVoucherCode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <HiOutlineTag className="h-3 w-3" />
                    Shop: {order.shopVoucherCode} (-{formatCurrency(order.shopDiscountAmount || 0)})
                  </span>
                )}
                {order.platformVoucherCode && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <HiOutlineTag className="h-3 w-3" />
                    Sàn: {order.platformVoucherCode} (-{formatCurrency(order.platformDiscountAmount || 0)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Customer & Shipping Summary (5 cols) */}
        <div
          className={cn(
            'lg:col-span-5 lg:border-l lg:pl-5 flex flex-col justify-between space-y-2 border-t lg:border-t-0 pt-3 lg:pt-0',
            isDark ? 'border-slate-800' : 'border-stone-100'
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-slate-200">
              <HiOutlineUser className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{order.shippingName || order.userName || 'Khách hàng'}</span>
              {order.shippingPhone && (
                <span className="font-mono text-stone-500 dark:text-slate-400 font-normal">
                  ({order.shippingPhone})
                </span>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-stone-500 dark:text-slate-400">
              <HiOutlineLocationMarker className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
              <p className="line-clamp-2 leading-relaxed">
                {[order.shippingAddress, order.shippingWard, order.shippingDistrict, order.shippingCity]
                  .filter(Boolean)
                  .join(', ') || 'Chưa cập nhật địa chỉ'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-baseline justify-between border-t border-dashed border-stone-200 dark:border-slate-800">
            <span className="text-xs text-stone-500 dark:text-slate-400">Tổng thanh toán:</span>
            <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Footer Bar */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t',
          isDark ? 'border-slate-800 bg-slate-800/20' : 'border-stone-100 bg-stone-50/40'
        )}
      >
        <div className="text-xs text-stone-400">
          {order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)} món hàng
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action Buttons */}
          {canMoveToProcessing && onQuickStatusUpdate && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onQuickStatusUpdate(order.id, 'PROCESSING')}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              Xác Nhận & Đóng Gói
            </button>
          )}

          {canMoveToShipping && onQuickStatusUpdate && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onQuickStatusUpdate(order.id, 'SHIPPING')}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              Giao Cho GHN
            </button>
          )}

          {canMarkDelivered && onQuickStatusUpdate && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                if (window.confirm(`Xác nhận đơn hàng ${order.orderNumber} đã giao thành công?`)) {
                  onQuickStatusUpdate(order.id, 'DELIVERED')
                }
              }}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              Xác Nhận Đã Giao
            </button>
          )}

          {/* View Details Link */}
          <Link
            to={`/orders/${order.id}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-sm'
            )}
          >
            <span>Chi tiết đơn</span>
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
