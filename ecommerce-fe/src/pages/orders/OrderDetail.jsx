import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import returnService from '../../services/returnService'
import escrowService from '../../services/escrow'
import ReviewModal from '../../components/ReviewModal'
import OrderReportModal from '../../components/OrderReportModal'
import CustomerReturnCard from './components/CustomerReturnCard'
import OrderDisputeBanner from './components/OrderDisputeBanner'
import OrderItemsList from './components/OrderItemsList'
import OrderSummaryCard from './components/OrderSummaryCard'
import {
  getOrderEffectiveStatus,
  formatOrderCurrency,
  formatOrderDate,
} from '../../lib/orderStatus'

export default function OrderDetail() {
  const { orderId } = useParams()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewModal, setReviewModal] = useState({ open: false, productId: null, productName: '' })
  const [showReportModal, setShowReportModal] = useState(false)
  const [returnInfo, setReturnInfo] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !orderId) return
    fetchOrder()
  }, [isAuthenticated, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderData = await orderService.getMyOrderById(orderId)
      setOrder(orderData)
      let retInfo = orderData?.returnInfo || null
      if (!retInfo) {
        try {
          retInfo = await returnService.getReturnByOrderId(orderId)
        } catch {
          retInfo = null
        }
      }
      if (retInfo && !retInfo.settlement) {
        try {
          const settlement = await escrowService.getSettlementByOrderId(orderId)
          if (settlement) {
            retInfo = { ...retInfo, settlement }
          }
        } catch {
          // Bỏ qua nếu chưa settlement
        }
      }
      setReturnInfo(retInfo)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin đơn hàng')
      toast.error('Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReceived = async () => {
    if (!window.confirm('Bạn xác nhận đã nhận đầy đủ sản phẩm và hài lòng với đơn hàng? Thao tác này sẽ chuyển tiền cho Người bán.')) return
    try {
      await orderService.markOrderReceived(order.id)
      toast.success('Đã xác nhận nhận hàng thành công!')
      fetchOrder()
    } catch (e) {
      toast.error(e?.message || 'Có lỗi xảy ra khi xác nhận')
    }
  }

  const handlePayNow = async () => {
    try {
      const res = await orderService.createPayment(order.id)
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl
      } else {
        toast.error('Không thể tạo link thanh toán')
      }
    } catch (e) {
      toast.error(e?.message || 'Lỗi khi tạo thanh toán')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
          Vui lòng đăng nhập để xem đơn hàng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className={cn('min-h-screen px-4 py-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="mx-auto max-w-4xl">
          <Link
            to="/orders"
            className={cn(
              'mb-4 inline-flex items-center gap-2 text-sm font-medium',
              isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900',
            )}
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Quay lại danh sách đơn hàng
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>
              {error || 'Không tìm thấy đơn hàng'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const effectiveStatus = getOrderEffectiveStatus(order, returnInfo)
  const StatusIcon = effectiveStatus.icon
  const activeReturn = returnInfo || order.returnInfo
  const canConfirmOrDispute =
    order.status === 'DELIVERED' &&
    !order.hasActiveDispute &&
    (!activeReturn || activeReturn.status === 'CANCELLED')

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-4xl">
        <Link
          to="/orders"
          className={cn(
            'mb-6 inline-flex items-center gap-2 text-sm font-medium',
            isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900',
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Quay lại danh sách đơn hàng
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl border overflow-hidden', isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white')}
        >
          {/* Header */}
          <div className="border-b p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className={cn('text-xl sm:text-2xl font-bold tracking-tight font-mono', isDark ? 'text-white' : 'text-stone-900')}>
                    #{order.orderNumber}
                  </h1>
                  <span
                    className={cn(
                      'text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1',
                      order.paymentMethod === 'VNPAY'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : order.paymentMethod === 'WALLET'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
                    )}
                  >
                    {order.paymentMethod === 'VNPAY'
                      ? 'VNPay (Ký quỹ sàn)'
                      : order.paymentMethod === 'WALLET'
                        ? 'Ví số dư (Ký quỹ sàn)'
                        : 'COD (Thu hộ khi nhận)'}
                  </span>
                </div>
                <p className={cn('text-xs sm:text-sm mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Đặt ngày {formatOrderDate(order.createdAt)}
                  {order.shopName && (
                    <span className="font-medium text-stone-700 dark:text-slate-300"> • Cửa hàng: {order.shopName}</span>
                  )}
                </p>
              </div>

              <div className="self-start sm:self-auto shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-sm border',
                    effectiveStatus.color,
                  )}
                >
                  <StatusIcon className="h-4 w-4" />
                  {effectiveStatus.label}
                </span>
              </div>
            </div>

            {/* Banners for Escrow Guidance & Disputes */}
            <OrderDisputeBanner
              order={order}
              returnInfo={activeReturn}
              isDark={isDark}
            />

            {/* Quick Action Bar for DELIVERED */}
            {canConfirmOrDispute && (
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleMarkReceived}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-[0.98]"
                >
                  <HiOutlineCheckCircle className="h-4 w-4" />
                  Đã nhận được hàng
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all duration-150 active:scale-[0.98]"
                >
                  <HiOutlineExclamationCircle className="h-4 w-4 text-rose-500" />
                  Khiếu nại / Báo sự cố
                </button>
              </div>
            )}
          </div>

          {/* Return & Refund Process Section */}
          {activeReturn && (
            <div className="border-b p-5 sm:p-6">
              <CustomerReturnCard
                returnInfo={activeReturn}
                isDark={isDark}
                onRefresh={fetchOrder}
              />
            </div>
          )}

          {/* Shipping Address */}
          <div className="border-b p-6">
            <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Địa chỉ giao hàng
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
                <p className={cn('text-sm font-mono', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  {order.shippingPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <OrderItemsList
            items={order.items}
            orderStatus={order.status}
            isDark={isDark}
            formatCurrency={formatOrderCurrency}
            onOpenReview={(reviewTarget) =>
              setReviewModal({
                open: true,
                productId: reviewTarget.productId,
                productName: reviewTarget.productName,
              })
            }
          />

          {/* Order Summary & Escrow */}
          <OrderSummaryCard
            order={order}
            isDark={isDark}
            formatCurrency={formatOrderCurrency}
            onPayNow={handlePayNow}
          />
        </motion.div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={reviewModal.open}
          onClose={() => setReviewModal({ open: false, productId: null, productName: '' })}
          subOrderId={order?.id}
          productId={reviewModal.productId}
          productName={reviewModal.productName}
          onPageRefresh={fetchOrder}
        />

        {/* Order Report / Dispute Modal */}
        <OrderReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          order={order}
          onSuccess={fetchOrder}
        />
      </div>
    </div>
  )
}
