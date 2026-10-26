import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import AdminOrderDetailCard from './components/order/AdminOrderDetailCard'

export default function AdminOrderDetail() {
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
      const orderData = await orderService.getOrderById(orderId)
      setOrder(orderData)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin đơn hàng')
      toast.error('Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('p-12 text-center rounded-2xl border', isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-white text-stone-600')}>
        <p className="text-base font-medium">Vui lòng đăng nhập để xem thông tin đơn hàng.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        <p className={cn('mt-4 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang tải chi tiết đơn hàng...
        </p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Link
          to="/orders"
          className={cn(
            'inline-flex items-center gap-2 text-sm font-semibold transition-colors',
            isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900',
          )}
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách gian hàng</span>
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className={cn('text-sm font-medium', isDark ? 'text-red-400' : 'text-red-600')}>
            {error || 'Không tìm thấy đơn hàng'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to={order?.shopId ? `/orders/shops/${order.shopId}` : '/orders'}
        className={cn(
          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95',
          isDark
            ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100',
        )}
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        <span>{order?.shopName ? `← Quay lại đơn hàng của ${order.shopName}` : '← Quay lại danh sách gian hàng'}</span>
      </Link>

      <AdminOrderDetailCard order={order} isDark={isDark} />
    </div>
  )
}
