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
    COMPLETED: 'Đã nhận được hàng',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
    PENDING_PAYMENT: 'Chờ thanh toán',
  }
  return statusMap[status] || status
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin đơn hàng')
      toast.error('Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
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

  const statusBadge = getStatusBadge(order.status)
  const StatusIcon = statusBadge.icon

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
          className={cn('rounded-xl border', isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white')}
        >
          {/* Header */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Đơn hàng {order.orderNumber}
                </h1>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Đặt ngày {formatDate(order.createdAt)}
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
              {['DELIVERED'].includes(order.status) && (
                <button
                  onClick={async () => {
                    if (!window.confirm("Bạn xác nhận đã nhận được hàng?")) return;
                    try {
                      await orderService.markOrderReceived(order.id);
                      toast.success("Đã xác nhận nhận hàng!");
                      fetchOrder();
                    } catch (e) {
                      toast.error("Có lỗi xảy ra");
                    }
                  }}
                  className="ml-4 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
                >
                  Đã nhận được hàng
                </button>
              )}
            </div>
          </div>

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
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  {order.shippingPhone}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-b p-6">
            <h2 className={cn('mb-4 font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
              Sản phẩm
            </h2>
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

          {/* Order Summary */}
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Tạm tính
                </span>
                <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                  Phí vận chuyển
                </span>
                <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatCurrency(order.shippingFee || 0)}
                </span>
              </div>
              {order.ghnOrderCode && (
                <div className="flex justify-between">
                  <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Mã vận đơn GHN
                  </span>
                  <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                    {order.ghnOrderCode}
                  </span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                    Tổng cộng
                  </span>
                  <span className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              {/* Payment Button for PENDING_PAYMENT */}
              {order.status === 'PENDING_PAYMENT' && (
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={async () => {
                      try {
                        const res = await orderService.createPayment(order.id);
                        if (res.paymentUrl) {
                          window.location.href = res.paymentUrl;
                        } else {
                          toast.error("Không thể tạo link thanh toán");
                        }
                      } catch (e) {
                        toast.error(e.message || "Lỗi khi tạo thanh toán");
                      }
                    }}
                    className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/30 active:scale-95"
                  >
                    Thanh toán ngay ({formatCurrency(order.total)})
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
