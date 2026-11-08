import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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
import reportService from '../../services/report'
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
  const [report, setReport] = useState(null)

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

      // Tải thông tin khiếu nại / phán quyết của đơn nếu có
      try {
        const repData = await reportService.getReportByOrderId(orderId)
        setReport(repData || null)
      } catch {
        setReport(null)
      }
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

  const ink = isDark ? 'text-white' : 'text-stone-950'
  const muted = isDark ? 'text-slate-400' : 'text-stone-600'
  const panel = isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
  const stepIndex = TRACK_INDEX[order.status]
  const paymentLabel = order.paymentMethod === 'VNPAY' ? 'VNPay' : order.paymentMethod === 'WALLET' ? 'Ví sàn' : 'COD'

  return (
    <div className={cn('min-h-screen px-4 py-6 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <nav aria-label="Đường dẫn" className={cn('flex items-center gap-2 text-[13px]', muted)}>
          <Link to="/orders" className="inline-flex items-center gap-1.5 hover:underline">
            <HiOutlineArrowLeft className="h-4 w-4" /> Đơn hàng
          </Link>
          <span>/</span>
          <span className={cn('font-mono', ink)}>#{order.orderNumber}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className={cn('text-3xl font-bold tracking-[-0.03em] sm:text-4xl', ink)}>{effectiveStatus.label}</h1>
            <p className={cn('text-sm', muted)}>
              Đặt ngày {formatOrderDate(order.createdAt)}
              {order.shopName && <> · {order.shopName}</>}
              {' · '}
              <span className="font-mono uppercase">{paymentLabel}</span>
            </p>
          </div>
          <span className={cn('inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold', effectiveStatus.color)}>
            <StatusIcon className="h-4 w-4" />
            {effectiveStatus.label}
          </span>
        </div>

        {stepIndex !== undefined && (
          <ol aria-label="Hành trình đơn hàng" className={cn('grid grid-cols-2 gap-1 rounded-lg border p-5 sm:grid-cols-5', panel)}>
            {TRACK_STEPS.map((label, i) => (
              <li
                key={label}
                aria-current={i === stepIndex ? 'step' : undefined}
                className={cn(
                  'flex flex-col gap-1 border-t-[3px] pt-2.5',
                  i < stepIndex ? (isDark ? 'border-white' : 'border-stone-950') : i === stepIndex ? 'border-amber-500' : isDark ? 'border-slate-700' : 'border-stone-200',
                )}
              >
                <span className={cn('font-mono text-[11px]', muted)}>0{i + 1}</span>
                <strong className={cn('text-sm', i <= stepIndex ? ink : muted)}>{label}</strong>
              </li>
            ))}
          </ol>
        )}

        <OrderDisputeBanner order={order} returnInfo={activeReturn} report={report} isDark={isDark} onRefresh={fetchOrder} />

        {canConfirmOrDispute && (
          <section className={cn('flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 p-5', isDark ? 'border-white bg-slate-900' : 'border-stone-950 bg-white')}>
            <div className="flex max-w-xl flex-col gap-1">
              <strong className={cn('text-base', ink)}>Bạn đã nhận được hàng?</strong>
              <span className={cn('text-sm leading-relaxed', muted)}>
                Xác nhận để giải ngân cho shop. Nếu hàng có vấn đề, gửi khiếu nại trước khi xác nhận; tiền vẫn được giữ trong ký quỹ.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-700 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <HiOutlineExclamationCircle className="h-4 w-4" />
                Khiếu nại / Báo sự cố
              </button>
              <button
                type="button"
                onClick={handleMarkReceived}
                className={cn('inline-flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold', isDark ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-stone-800')}
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                Đã nhận được hàng
              </button>
            </div>
          </section>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="flex flex-col gap-5">
            {activeReturn && (
              <section className={cn('rounded-lg border p-5 sm:p-6', panel)}>
                <CustomerReturnCard returnInfo={activeReturn} order={order} report={report} isDark={isDark} onRefresh={fetchOrder} />
              </section>
            )}
            <section className={cn('overflow-hidden rounded-lg border', panel)}>
              <OrderItemsList
                items={order.items}
                orderStatus={order.status}
                isDark={isDark}
                formatCurrency={formatOrderCurrency}
                onOpenReview={(reviewTarget) =>
                  setReviewModal({ open: true, productId: reviewTarget.productId, productName: reviewTarget.productName })
                }
              />
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <section className={cn('overflow-hidden rounded-lg border', panel)}>
              <OrderSummaryCard order={order} report={report} isDark={isDark} formatCurrency={formatOrderCurrency} onPayNow={handlePayNow} />
            </section>
            <section className={cn('flex flex-col gap-2 rounded-lg border p-5 text-sm', panel)}>
              <h2 className={cn('mb-1 text-xl font-bold', ink)}>Giao đến</h2>
              <span className={cn('flex items-start gap-2 font-semibold', ink)}>
                <HiOutlineLocationMarker className={cn('mt-0.5 h-4 w-4 shrink-0', muted)} />
                {order.shippingName}
              </span>
              <span className={cn('pl-6 leading-relaxed', muted)}>
                {order.shippingAddress}
                <br />
                {[order.shippingWard, order.shippingDistrict, order.shippingCity].filter(Boolean).join(', ')}
              </span>
              <span className={cn('flex items-center gap-2 font-mono', muted)}>
                <HiOutlinePhone className="h-4 w-4" />
                {order.shippingPhone}
              </span>
            </section>
          </aside>
        </div>

        <ReviewModal
          isOpen={reviewModal.open}
          onClose={() => setReviewModal({ open: false, productId: null, productName: '' })}
          subOrderId={order?.id}
          productId={reviewModal.productId}
          productName={reviewModal.productName}
          onPageRefresh={fetchOrder}
        />
        <OrderReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} order={order} onSuccess={fetchOrder} />
      </div>
    </div>
  )
}

const TRACK_STEPS = ['Đặt hàng', 'Shop xác nhận', 'Đang giao', 'Đã giao', 'Hoàn tất · giải ngân']
// Cancelled/refunded orders have no forward journey, so they show no tracker.
const TRACK_INDEX = {
  PENDING_PAYMENT: 0, PENDING: 0, CONFIRMED: 1, PROCESSING: 1, SHIPPING: 2, SHIPPED: 2, DELIVERED: 3, COMPLETED: 4,
}
