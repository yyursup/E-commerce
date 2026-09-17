import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import OrderStatusBadge from './components/order/OrderStatusBadge'
import SellerOrderActions from './components/order/SellerOrderActions'
import OrderAddressSection from './components/order/OrderAddressSection'
import OrderItemsSection from './components/order/OrderItemsSection'
import OrderSummarySection from './components/order/OrderSummarySection'
import { formatDate } from './components/order/orderHelpers'

export default function ShopOrderDetail() {
  const { orderId } = useParams()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [ghnOrderCodeInput, setGhnOrderCodeInput] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !orderId) return
    fetchOrder()
  }, [isAuthenticated, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderData = await orderService.getShopOrderById(orderId)
      setOrder(orderData)
      setGhnOrderCodeInput(orderData?.ghnOrderCode || '')
    } catch (err) {
      console.error('Error fetching order:', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải thông tin đơn hàng'
      setError(msg)
      toast.error(msg, { id: 'fetch-order-detail-error' })
    } finally {
      setLoading(false)
    }
  }

  const runSellerAction = async (action, successMessage) => {
    try {
      setActionLoading(true)
      await action()
      toast.success(successMessage)
      await fetchOrder()
    } catch (err) {
      toast.error(err?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (status) => {
    await runSellerAction(
      () => orderService.updateOrderStatus(order.id, status),
      'Đã cập nhật trạng thái đơn hàng thành công'
    )
  }

  const handleRetryCreateGhn = async () => {
    await runSellerAction(
      () => orderService.retryCreateGhnOrder(order.id),
      'Đã gửi yêu cầu tạo lại đơn GHN Express'
    )
  }

  const handleSetManualGhnCode = async () => {
    const code = ghnOrderCodeInput.trim()
    if (!code) {
      toast.error('Vui lòng nhập mã GHN')
      return
    }
    await runSellerAction(
      () => orderService.setGhnOrderCode(order.id, code),
      'Đã lưu mã vận đơn GHN thành công'
    )
  }

  // Stepper steps calculation
  const getStepStatus = (stepIndex) => {
    const status = order?.status
    if (status === 'CANCELLED' || status === 'REFUNDED') return 'cancelled'

    // Steps: 1. Đặt hàng (CONFIRMED), 2. Đang đóng gói (PROCESSING), 3. Vận chuyển (SHIPPING), 4. Giao thành công (DELIVERED / COMPLETED)
    const statusOrder = {
      PENDING_PAYMENT: 0.5,
      CONFIRMED: 1,
      PROCESSING: 2,
      SHIPPING: 3,
      SHIPPED: 3,
      DELIVERED: 4,
      COMPLETED: 4,
    }

    const currentLevel = statusOrder[status] || 1
    if (currentLevel > stepIndex) return 'completed'
    if (currentLevel === stepIndex) return 'current'
    return 'upcoming'
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-[70vh] flex items-center justify-center p-6', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-base font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
          Vui lòng đăng nhập để xem chi tiết đơn hàng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
          <p className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Đang tải thông tin đơn hàng...
          </p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/orders"
          className={cn(
            'inline-flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors',
            isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </Link>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-500">
            {error || 'Không tìm thấy thông tin đơn hàng'}
          </p>
          <button
            type="button"
            onClick={fetchOrder}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-600 transition-all"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    )
  }

  const steps = [
    { num: 1, title: 'Đã Đặt Hàng', desc: 'Khách xác nhận đơn' },
    { num: 2, title: 'Đóng Gói Hàng', desc: 'Shop chuẩn bị hàng' },
    { num: 3, title: 'Vận Chuyển GHN', desc: 'Bàn giao shipper GHN' },
    { num: 4, title: 'Giao Thành Công', desc: 'Giải ngân Escrow' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className={cn(
              'inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors mb-2',
              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
            )}
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách đơn hàng</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn('text-2xl sm:text-3xl font-black font-mono tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              {order.orderNumber}
            </h1>
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-bold border',
              order.paymentMethod === 'VNPAY'
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            )}>
              {order.paymentMethod === 'VNPAY' ? 'VNPAY (Trực tuyến)' : 'COD (Tiền mặt khi nhận)'}
            </span>
            <OrderStatusBadge status={order.status} className="px-3 py-1 text-xs" />
          </div>
          <p className={cn('mt-1 text-xs sm:text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Đặt lúc: <strong>{formatDate(order.createdAt)}</strong> • Khách hàng: <strong>{order.userName || order.shippingName || '-'}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrder}
          disabled={loading || actionLoading}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all shadow-sm self-start sm:self-auto',
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
          )}
        >
          <HiOutlineRefresh className={cn('h-4 w-4', (loading || actionLoading) && 'animate-spin text-amber-500')} />
          <span>Làm mới chi tiết</span>
        </button>
      </div>

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-3xl border overflow-hidden shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        {/* Order Stepper Progress Indicator */}
        <div
          className={cn(
            'border-b p-6',
            isDark ? 'border-slate-800 bg-slate-800/30' : 'border-stone-100 bg-stone-50/70'
          )}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step) => {
              const state = getStepStatus(step.num)
              const isDone = state === 'completed'
              const isCurr = state === 'current'
              const isCancelled = state === 'cancelled'

              return (
                <div key={step.num} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-all',
                      isCancelled
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : isDone
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                        : isCurr
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-4 ring-amber-500/20'
                        : isDark
                        ? 'bg-slate-800 text-slate-500 border border-slate-700'
                        : 'bg-stone-200 text-stone-500'
                    )}
                  >
                    {isDone ? (
                      <HiOutlineCheckCircle className="h-5 w-5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-xs font-bold truncate',
                        isCurr
                          ? 'text-amber-500'
                          : isDone
                          ? isDark
                            ? 'text-white'
                            : 'text-stone-900'
                          : 'text-stone-400'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-slate-500 truncate">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 1. Seller Actions & GHN Tracking */}
        <SellerOrderActions
          order={order}
          isDark={isDark}
          actionLoading={actionLoading}
          ghnOrderCodeInput={ghnOrderCodeInput}
          onGhnOrderCodeChange={setGhnOrderCodeInput}
          onUpdateStatus={handleUpdateStatus}
          onRetryCreateGhn={handleRetryCreateGhn}
          onSetManualGhnCode={handleSetManualGhnCode}
        />

        {/* 2. Customer & Address Details */}
        <OrderAddressSection order={order} isDark={isDark} />

        {/* 3. Items List */}
        <OrderItemsSection items={order.items} isDark={isDark} />

        {/* 4. Financial Summary & Escrow Protection */}
        <OrderSummarySection order={order} isDark={isDark} />
      </motion.div>
    </div>
  )
}
