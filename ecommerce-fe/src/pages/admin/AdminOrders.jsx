import { useState, useEffect } from 'react'
import { HiOutlineShoppingBag } from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import { ADMIN_ORDER_STATUSES } from './components/order/orderHelpers'
import AdminOrderListCard from './components/order/AdminOrderListCard'

export default function AdminOrders() {
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
      const ordersData = await orderService.getAllOrders(status)
      setOrders(ordersData || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách đơn hàng')
      toast.error('Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
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
            Quản lý đơn hàng
          </h1>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Xem và quản lý tất cả đơn hàng trên hệ thống
          </p>
        </div>

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
            {ADMIN_ORDER_STATUSES.map((status) => (
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
            isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white',
          )}>
            <HiOutlineShoppingBag className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-400')} />
            <p className={cn('mt-4 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Chưa có đơn hàng nào
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <AdminOrderListCard key={order.id} order={order} isDark={isDark} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
