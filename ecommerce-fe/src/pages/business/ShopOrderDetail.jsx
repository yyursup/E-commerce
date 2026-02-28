import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
  HiOutlineLocationMarker,
  HiOutlinePhone,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'

const getStatusBadge = (status) => {
  const statusMap = {
    PENDING_PAYMENT: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: HiOutlineClock },
    PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: HiOutlineClock },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: HiOutlineCheckCircle },
    PROCESSING: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: HiOutlineTruck },
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
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
    PENDING_PAYMENT: 'Chờ thanh toán',
  }
  return statusMap[status] || status
}

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
      setError(err?.response?.data?.message || err?.message || 'Khong the tai thong tin don hang')
      toast.error('Khong the tai thong tin don hang')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)

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
      'Đã cập nhật trạng thái đơn hàng'
    )
  }

  const handleRetryCreateGhn = async () => {
    await runSellerAction(
      () => orderService.retryCreateGhnOrder(order.id),
      'Đã thử tạo đơn GHN lại'
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
      'Đã lưu mã GHN'
    )
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className={cn('min-h-screen px-4 py-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="mx-auto max-w-4xl">
          <Link
            to="/business/orders"
            className={cn(
              'mb-4 inline-flex items-center gap-2 text-sm font-medium',
              isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900',
            )}
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            Quay lại danh sách đơn hàng
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>{error || 'Khong tim thay don hang'}</p>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(order.status)
  const StatusIcon = statusBadge.icon
  const isNoGhnCode = !order.ghnOrderCode
  const canMoveToProcessing = order.status === 'CONFIRMED'
  const canMoveToShipping = order.status === 'PROCESSING'
  const canCancel = order.status === 'CONFIRMED'
  const canMarkDelivered = order.status === 'SHIPPING'
  const canRetryGhn = ['CONFIRMED', 'PROCESSING', 'SHIPPING'].includes(order.status) && isNoGhnCode

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-4xl">
        <Link
          to="/business/orders"
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
          className={cn('rounded-xl border', isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white')}
        >
          <div className="border-b p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Đơn hàng {order.orderNumber}
                </h1>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Đặt ngày {formatDate(order.createdAt)}
                </p>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Khách hàng: {order.userName}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
                  statusBadge.color,
                )}
              >
                <StatusIcon className="h-4 w-4" />
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>

          <div className="border-b p-6">
            <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>Hành động người bán</h2>

            {order.status === 'PENDING_PAYMENT' && (
              <p className={cn('mb-3 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Đơn hàng đang chờ người mua thanh toán.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {canMoveToProcessing && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('PROCESSING')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                    actionLoading ? 'cursor-not-allowed bg-amber-400/70' : 'bg-amber-500 hover:bg-amber-600',
                  )}
                >
                  Chuyển sang xử lý
                </button>
              )}

              {canMoveToShipping && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('SHIPPING')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                    actionLoading ? 'cursor-not-allowed bg-blue-400/70' : 'bg-blue-500 hover:bg-blue-600',
                  )}
                >
                  Chuyển sang giao hàng
                </button>
              )}

              {canMarkDelivered && (
                <button
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm('Xac nhan don hang da giao thanh cong?')) return
                    await handleUpdateStatus('DELIVERED')
                  }}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                    actionLoading ? 'cursor-not-allowed bg-green-400/70' : 'bg-green-500 hover:bg-green-600',
                  )}
                >
                  Xác nhận đã giao hàng
                </button>
              )}

              {canCancel && (
                <button
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!window.confirm('Ban chac chan muon huy don hang nay?')) return
                    await handleUpdateStatus('CANCELLED')
                  }}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                    actionLoading ? 'cursor-not-allowed bg-red-400/70' : 'bg-red-500 hover:bg-red-600',
                  )}
                >
                  Hủy đơn
                </button>
              )}
            </div>

            {canRetryGhn && (
              <div className={cn(
                'mt-4 rounded-lg border p-4',
                isDark ? 'border-slate-700 bg-slate-800/40' : 'border-stone-200 bg-stone-50',
              )}>
                <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                  Đơn chưa có mã GHN. Bạn có thể tự tạo mã hoặc nhập mã thủ công.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={handleRetryCreateGhn}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                      actionLoading ? 'cursor-not-allowed bg-indigo-400/70' : 'bg-indigo-500 hover:bg-indigo-600',
                    )}
                  >
                    Thử tạo GHN lại
                  </button>

                  <input
                    value={ghnOrderCodeInput}
                    onChange={(e) => setGhnOrderCodeInput(e.target.value)}
                    placeholder="Nhap ma GHN thu cong"
                    className={cn(
                      'w-64 rounded-lg border px-3 py-2 text-sm outline-none transition',
                      isDark
                        ? 'border-slate-600 bg-slate-900 text-white focus:border-amber-500/60'
                        : 'border-stone-300 bg-white text-stone-900 focus:border-amber-500',
                    )}
                  />
                  <button
                    disabled={actionLoading}
                    onClick={handleSetManualGhnCode}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium text-white transition',
                      actionLoading ? 'cursor-not-allowed bg-slate-500/70' : 'bg-slate-700 hover:bg-slate-800',
                    )}
                  >
                    Lưu mã GHN
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-b p-6">
            <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>Địa chỉ giao hàng</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <HiOutlineLocationMarker className={cn('mt-0.5 h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
                <div>
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-stone-900')}>{order.shippingName}</p>
                  <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>{order.shippingAddress}</p>
                  <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    {order.shippingWard}, {order.shippingDistrict}, {order.shippingCity}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlinePhone className={cn('h-5 w-5', isDark ? 'text-slate-400' : 'text-stone-500')} />
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>{order.shippingPhone}</p>
              </div>
            </div>
          </div>

          <div className="border-b p-6">
            <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>San pham</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.productImageUrl || '/product-placeholder.svg'}
                    alt={item.productName}
                    className="h-20 w-20 rounded-lg object-cover bg-stone-100 dark:bg-slate-800"
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
                      Số lượng: {item.quantity}
                    </p>
                    <p className={cn('mt-1 text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>Tạm tính</span>
                <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>Phí vận chuyển</span>
                <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatCurrency(order.shippingFee)}
                </span>
              </div>
              {order.ghnOrderCode && (
                <div className="flex justify-between">
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>Mã vận đơn GHN</span>
                  <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>{order.ghnOrderCode}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>Tổng cộng</span>
                  <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
