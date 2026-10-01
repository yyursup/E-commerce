import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
  HiOutlineCreditCard,
  HiOutlineStar,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import OrderReportModal from '../../components/OrderReportModal'

const ORDER_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'SHIPPED', label: 'Đã giao hàng' },
  { value: 'DELIVERED', label: 'Đã nhận hàng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
]

const getStatusBadge = (status) => {
  const statusMap = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: HiOutlineClock },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: HiOutlineCheckCircle },
    PROCESSING: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: HiOutlineShoppingBag },
    SHIPPING: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: HiOutlineTruck },
    SHIPPED: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: HiOutlineTruck },
    DELIVERED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: HiOutlineCheckCircle },
    COMPLETED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: HiOutlineCheckCircle },
    CANCELLED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: HiOutlineXCircle },
    REFUNDED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: HiOutlineXCircle },
  }
  return statusMap[status] || { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: HiOutlineClock }
}

const getStatusLabel = (status) => {
  const statusMap = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    SHIPPED: 'Đã giao hàng',
    DELIVERED: 'Đã giao hàng thành công',
    COMPLETED: 'Đã nhận được hàng',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
    PENDING_PAYMENT: 'Chờ thanh toán',
  }
  return statusMap[status] || status
}

const getReturnStatusDisplay = (returnStatus) => {
  const map = {
    WAITING_FOR_SHIPMENT: {
      label: 'Đang trả hàng (Chờ gửi hàng)',
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
      label: 'Tranh chấp hàng hoàn',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-300 dark:border-rose-700',
      icon: HiOutlineExclamationCircle,
    },
    COMPLETED: {
      label: 'Đã hoàn hàng & Hoàn tiền',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
      icon: HiOutlineCheckCircle,
    },
    CANCELLED: {
      label: 'Đã hủy trả hàng',
      color: 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-300 dark:border-slate-700',
      icon: HiOutlineXCircle,
    },
  }
  return map[returnStatus] || null
}

export default function MyOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [escrowHeld, setEscrowHeld] = useState(0)
  const [reportingOrder, setReportingOrder] = useState(null)

  const isDelayedShipping = (order) => {
    if (!order) return false
    if (!['SHIPPED', 'SHIPPING'].includes(order.status)) return false
    const shipDate = order.shippedAt || order.updatedAt || order.createdAt
    if (!shipDate) return false
    const diffDays = (new Date() - new Date(shipDate)) / (1000 * 60 * 60 * 24)
    return diffDays >= 3
  }

  // Statuses where buyer money is held in system escrow
  const ESCROW_HELD_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED']

  useEffect(() => {
    if (!isAuthenticated) return
    fetchData()
  }, [isAuthenticated, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const status = statusFilter || null

      const ordersData = await orderService.getMyOrders(status)
      setOrders(ordersData || [])

      // Compute escrow-held from orders (only when showing all orders)
      // buyer wallet.lockedBalance is always 0 — escrow funds go to system ESCROW wallet
      if (!statusFilter) {
        const held = (ordersData || []).filter(o =>
          ESCROW_HELD_STATUSES.includes(o.status)
        ).reduce((sum, o) => sum + (o.total || 0), 0)
        setEscrowHeld(held)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu')
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReceived = async (orderId) => {
    if (!window.confirm("Bạn xác nhận đã nhận được hàng và hài lòng với sản phẩm?")) return;
    try {
      await orderService.markOrderReceived(orderId);
      toast.success("Đã xác nhận nhận hàng!");
      fetchData(); // Reload list
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center">
          <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Vui lòng đăng nhập để xem đơn hàng
          </p>
        </div>
      </div>
    )
  }

  const canMarkReceived = (order) => ['DELIVERED'].includes(order.status) && !order.hasActiveDispute && (!order.returnInfo || order.returnInfo.status === 'CANCELLED');

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Đơn hàng của tôi
            </h1>
            <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Quản lý và theo dõi đơn hàng của bạn
            </p>
          </div>

          {/* Escrow Held Card */}
          <div className={cn(
            "flex items-center gap-4 px-5 py-4 rounded-2xl shadow-sm border",
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
          )}>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <HiOutlineCreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-stone-500")}>
                Ký Quỹ Đang Bảo Vệ (Escrow)
              </p>
              <p className={cn("text-xl font-bold font-mono text-amber-600 dark:text-amber-400", isDark ? "text-amber-400" : "text-amber-600")}>
                {formatCurrency(statusFilter === '' ? escrowHeld : walletBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex gap-2 min-w-max">
            {ORDER_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 border',
                  statusFilter === status.value
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : isDark
                      ? 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
            <p className={cn('text-sm font-medium', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className={cn(
            'rounded-3xl border p-12 text-center',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
          )}>
            <HiOutlineShoppingBag className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-300')} />
            <p className={cn('mt-4 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Bạn chưa có đơn hàng nào trong mục này
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusBadge = getStatusBadge(order.status)
              const StatusIcon = statusBadge.icon
              const thumbnailImage = order.items?.[0]?.productImageUrl

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden flex flex-col',
                    isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
                  )}
                >
                  {/* Card Header: Shop info & status badge */}
                  <div className={cn(
                    'px-5 py-3 border-b flex items-center justify-between gap-3 text-xs flex-wrap',
                    isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-100 bg-stone-50/50'
                  )}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-800 dark:text-slate-200">
                        {order.shopName || 'Marketplace Store'}
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        order.paymentMethod === 'VNPAY'
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          : order.paymentMethod === 'WALLET'
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      )}>
                        {order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'WALLET' ? 'Ví sàn' : 'COD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {order.hasActiveDispute && (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border uppercase tracking-wider',
                          order.disputeStatus === 'REPORT_PENDING'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        )}>
                          <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
                          {order.disputeStatus === 'REPORT_PENDING' && 'Đang khiếu nại'}
                          {order.disputeStatus === 'REPORT_APPROVED' && 'Khiếu nại được duyệt'}
                          {order.disputeStatus === 'APPEAL_PENDING' && 'Shop đang kháng cáo'}
                        </span>
                      )}
                      {(() => {
                        const returnDisplay = order.returnInfo
                          ? getReturnStatusDisplay(order.returnInfo.status)
                          : null
                        const badgeObj = returnDisplay || statusBadge
                        const BadgeIcon = badgeObj.icon
                        const labelText = returnDisplay ? returnDisplay.label : getStatusLabel(order.status)
                        return (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border',
                              badgeObj.color,
                            )}
                          >
                            <BadgeIcon className="h-3.5 w-3.5" />
                            {labelText}
                          </span>
                        )
                      })()}
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
                        alt={order.items?.[0]?.productName || 'Product'}
                        className="h-20 w-20 sm:h-22 sm:w-22 rounded-xl object-cover bg-stone-100 dark:bg-slate-800 border dark:border-slate-800 border-stone-100 shadow-sm"
                        onError={(e) => { e.target.src = '/product-placeholder.svg' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn('text-sm font-bold line-clamp-1 group-hover:text-amber-500 transition-colors', isDark ? 'text-white' : 'text-stone-900')}>
                        {order.items?.[0]?.productName || `Đơn hàng #${order.orderNumber}`}
                      </h4>
                      {order.items?.[0] && (order.items[0].variantColor || order.items[0].variantSize) && (
                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                          Phân loại: {[order.items[0].variantColor, order.items[0].variantSize].filter(Boolean).join(' - ')}
                        </p>
                      )}
                      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                        {order.items?.length || 0} sản phẩm • Đặt ngày {formatDate(order.createdAt)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 mt-2 hover:underline">
                        Xem chi tiết kiện hàng <HiOutlineChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>

                  {/* Card Footer: Total price on left, Action buttons on right (NO LINK CLASH) */}
                  <div className={cn(
                    'px-5 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-100 bg-white'
                  )}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-stone-400 dark:text-slate-500">Tổng thanh toán:</span>
                      <span className={cn('text-base font-bold font-mono text-rose-500 dark:text-rose-400')}>
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                      {canMarkReceived(order) && (
                        <button
                          type="button"
                          onClick={() => handleMarkReceived(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95"
                        >
                          <HiOutlineCheckCircle className="h-4 w-4" />
                          Đã nhận được hàng
                        </button>
                      )}

                      {['DELIVERED'].includes(order.status) && !order.hasActiveDispute && (!order.returnInfo || order.returnInfo.status === 'CANCELLED') && (
                        <button
                          type="button"
                          onClick={() => setReportingOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all duration-150 active:scale-95"
                        >
                          <HiOutlineExclamationCircle className="h-3.5 w-3.5 text-rose-500" />
                          Khiếu nại
                        </button>
                      )}

                      {/* Chỉ hiển thị badge 'Đang xử lý trả hàng' khi tiến trình hoàn hàng thực sự đang diễn ra (chưa COMPLETED và chưa CANCELLED) */}
                      {order.returnInfo && order.returnInfo.status !== 'COMPLETED' && order.returnInfo.status !== 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                          <HiOutlineTruck className="h-4 w-4 text-indigo-500" />
                          Đang xử lý trả hàng
                        </span>
                      )}


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
            })}
          </div>
        )}

        {/* Order Report / Dispute Modal */}
        <OrderReportModal
          isOpen={reportingOrder !== null}
          onClose={() => setReportingOrder(null)}
          order={reportingOrder}
          onSuccess={fetchData}
        />
      </div>
    </div>
  )
}

