import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'

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
    DELIVERED: 'Đã nhận hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
    PENDING_PAYMENT: 'Chờ thanh toán',
  }
  return statusMap[status] || status
}

export default function MyOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    fetchOrders()
  }, [isAuthenticated, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const status = statusFilter || null
      const ordersData = await orderService.getMyOrders(status)
      setOrders(ordersData || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách đơn hàng')
      toast.error('Không thể tải danh sách đơn hàng')
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

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
            Đơn hàng của tôi
          </h1>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Quản lý và theo dõi đơn hàng của bạn
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm',
              'focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
              isDark
                ? 'border-slate-600 bg-slate-800 text-white'
                : 'border-stone-300 bg-white text-stone-900',
            )}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className={cn('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className={cn(
            'rounded-xl border p-12 text-center',
            isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white'
          )}>
            <HiOutlineShoppingBag className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-400')} />
            <p className={cn('mt-4 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Bạn chưa có đơn hàng nào
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'rounded-xl border p-6 transition-shadow hover:shadow-lg',
                    isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
                  )}
                >
                  <Link to={`/orders/${order.id}`}>
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
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                                statusBadge.color,
                              )}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
                            {order.shopName}
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
                        <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-stone-500')}>
                          Tổng cộng
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
