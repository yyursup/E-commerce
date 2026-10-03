import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineStar,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
} from 'react-icons/hi'
import { cn } from '../../../lib/cn'
import { getOrderEffectiveStatus } from '../../../lib/orderStatus'
import { getConditionBadge, getWarrantyBadge } from '../../../lib/techBadges'

export default function OrderItemCard({
  order,
  isDark,
  formatCurrency,
  formatDate,
  canMarkReceived,
  onMarkReceived,
  onReport,
}) {
  if (!order) return null

  const effectiveStatus = getOrderEffectiveStatus(order)
  const StatusIcon = effectiveStatus.icon
  const thumbnailImage = order.items?.[0]?.productImageUrl
  const firstItem = order.items?.[0]
  const hasActiveReturn =
    order.returnInfo &&
    order.returnInfo.status !== 'COMPLETED' &&
    order.returnInfo.status !== 'CANCELLED'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden flex flex-col',
        isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
      )}
    >
      {/* Card Header: Shop info & status badges */}
      <div
        className={cn(
          'px-5 py-3 border-b flex items-center justify-between gap-3 text-xs flex-wrap',
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-100 bg-stone-50/50',
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-stone-800 dark:text-slate-200">
            {order.shopName || 'Marketplace Store'}
          </span>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
              order.paymentMethod === 'VNPAY'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : order.paymentMethod === 'WALLET'
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
            )}
          >
            {order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'WALLET' ? 'Ví sàn' : 'COD'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dispute status indicator */}
          {order.hasActiveDispute && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border uppercase tracking-wider',
                order.disputeStatus === 'REPORT_PENDING'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
              )}
            >
              <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
              {order.disputeStatus === 'REPORT_PENDING' && 'Đang khiếu nại'}
              {order.disputeStatus === 'REPORT_APPROVED' && 'Khiếu nại được duyệt'}
              {order.disputeStatus === 'APPEAL_PENDING' && 'Shop đang kháng cáo'}
            </span>
          )}

          {/* Unified Order/Return Status badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border',
              effectiveStatus.color,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {effectiveStatus.label}
          </span>
        </div>
      </div>

      {/* Card Body: Clickable to view details */}
      <Link
        to={`/orders/${order.id}`}
        className="p-5 flex gap-4 transition-colors hover:bg-stone-50/40 dark:hover:bg-slate-800/30"
      >
        <div className="relative shrink-0">
          <img
            src={thumbnailImage || '/product-placeholder.svg'}
            alt={firstItem?.productName || 'Product'}
            className="h-20 w-20 sm:h-22 sm:w-22 rounded-xl object-cover bg-stone-100 dark:bg-slate-800 border dark:border-slate-800 border-stone-100 shadow-sm"
            onError={(e) => {
              e.target.src = '/product-placeholder.svg'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'text-sm font-bold line-clamp-1 group-hover:text-amber-500 transition-colors',
              isDark ? 'text-white' : 'text-stone-900',
            )}
          >
            {firstItem?.productName || `Đơn hàng #${order.orderNumber}`}
          </h4>
          {firstItem && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {firstItem.conditionGrade && (
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", getConditionBadge(firstItem.conditionGrade)?.cls)}>
                  {getConditionBadge(firstItem.conditionGrade)?.label}
                </span>
              )}
              {firstItem.warrantyType && (
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", getWarrantyBadge(firstItem.warrantyType, firstItem.warrantyMonths)?.cls)}>
                  {getWarrantyBadge(firstItem.warrantyType, firstItem.warrantyMonths)?.label}
                </span>
              )}
              {(firstItem.variantColor || firstItem.variantSize) && (
                <span className="text-[10px] text-stone-500 dark:text-slate-400 font-medium bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Phân loại: {[firstItem.variantColor, firstItem.variantSize].filter(Boolean).join(' - ')}
                </span>
              )}
            </div>
          )}
          <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
            {order.items?.length || 0} sản phẩm • Đặt ngày {formatDate(order.createdAt)}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 mt-2 hover:underline">
            Xem chi tiết kiện hàng <HiOutlineChevronRight className="h-3 w-3" />
          </span>
        </div>
      </Link>

      {/* Card Footer: Total price on left, Action buttons on right */}
      <div
        className={cn(
          'px-5 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-100 bg-white',
        )}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-stone-400 dark:text-slate-500">Tổng thanh toán:</span>
          <span className="text-base font-bold font-mono text-rose-500 dark:text-rose-400">
            {formatCurrency(order.total)}
          </span>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {canMarkReceived(order) && onMarkReceived && (
            <button
              type="button"
              onClick={() => onMarkReceived(order.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95"
            >
              <HiOutlineCheckCircle className="h-4 w-4" />
              Đã nhận được hàng
            </button>
          )}

          {['DELIVERED'].includes(order.status) &&
            !order.hasActiveDispute &&
            (!order.returnInfo || order.returnInfo.status === 'CANCELLED') &&
            onReport && (
              <button
                type="button"
                onClick={() => onReport(order)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all duration-150 active:scale-95"
              >
                <HiOutlineExclamationCircle className="h-3.5 w-3.5 text-rose-500" />
                Khiếu nại
              </button>
            )}

          {/* Badge 'Đang xử lý trả hàng' khi return đang diễn ra */}
          {hasActiveReturn && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
              <HiOutlineTruck className="h-4 w-4 text-indigo-500" />
              Đang xử lý trả hàng
            </span>
          )}

          {/* Badge trạng thái đối soát khiếu nại */}
          {order.hasActiveDispute && !order.returnInfo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <HiOutlineExclamationCircle className="h-4 w-4 text-amber-500" />
              {order.disputeStatus === 'REPORT_PENDING' && 'Đang đối soát khiếu nại'}
              {order.disputeStatus === 'REPORT_APPROVED' && 'Khiếu nại được chấp thuận'}
              {order.disputeStatus === 'APPEAL_PENDING' && 'Shop đang kháng cáo'}
            </span>
          )}

          {['DELIVERED', 'COMPLETED'].includes(order.status) && (
            <Link
              to={`/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-stone-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-500 transition-all duration-150"
            >
              <HiOutlineStar className="h-3.5 w-3.5 text-amber-500" />
              Đánh giá
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
