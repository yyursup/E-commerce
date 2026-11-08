import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineShoppingBag,
  HiOutlineCreditCard,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import OrderReportModal from '../../components/OrderReportModal'
import OrderItemCard from './components/OrderItemCard'
import {
  ORDER_STATUSES,
  formatOrderCurrency,
  formatOrderDate,
} from '../../lib/orderStatus'

// Statuses where buyer money is held in system escrow
const ESCROW_HELD_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED']

export default function MyOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState(null)
  const [walletBalance] = useState(0)
  const [escrowHeld, setEscrowHeld] = useState(0)
  const [reportingOrder, setReportingOrder] = useState(null)

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
      if (!statusFilter) {
        const held = (ordersData || [])
          .filter((o) => ESCROW_HELD_STATUSES.includes(o.status))
          .reduce((sum, o) => sum + (o.total || 0), 0)
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
    if (!window.confirm('Bạn xác nhận đã nhận được hàng và hài lòng với sản phẩm?')) return
    try {
      await orderService.markOrderReceived(orderId)
      toast.success('Đã xác nhận nhận hàng!')
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại.')
    }
  }

  const canMarkReceived = (order) =>
    ['DELIVERED'].includes(order.status) &&
    !order.hasActiveDispute &&
    (!order.returnInfo || order.returnInfo.status === 'CANCELLED')

  const ink = isDark ? 'text-white' : 'text-stone-950'
  const muted = isDark ? 'text-slate-400' : 'text-stone-600'
  const panel = isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-lg', muted)}>Vui lòng đăng nhập để xem đơn hàng</p>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className={cn('font-mono text-xs uppercase tracking-[0.06em]', muted)}>Tài khoản</span>
            <h1 className={cn('mt-1 text-4xl font-bold tracking-[-0.03em] sm:text-5xl', ink)}>Đơn hàng</h1>
          </div>

          {/* Money currently protected by escrow */}
          <div className="flex min-w-[280px] flex-col gap-1 rounded-lg bg-stone-950 px-5 py-4 text-white dark:border dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-stone-400">
              <HiOutlineCreditCard className="h-4 w-4" /> Đang giữ trong ký quỹ
            </span>
            <strong className="font-mono text-2xl font-semibold">
              {formatOrderCurrency(statusFilter === '' ? escrowHeld : walletBalance)}
            </strong>
            <span className="text-xs text-stone-400">Chỉ chuyển cho shop khi bạn xác nhận đã nhận hàng</span>
          </div>
        </div>

        <div role="tablist" aria-label="Lọc theo trạng thái" className={cn('flex overflow-x-auto border-b no-scrollbar', isDark ? 'border-slate-800' : 'border-stone-200')}>
          {ORDER_STATUSES.map((status) => {
            const on = statusFilter === status.value
            return (
              <button
                key={status.value}
                role="tab"
                aria-selected={on}
                onClick={() => setStatusFilter(status.value)}
                className={cn(
                  '-mb-px shrink-0 border-b-2 px-3.5 py-3 text-sm transition-colors',
                  on
                    ? cn('font-bold', isDark ? 'border-white text-white' : 'border-stone-950 text-stone-950')
                    : cn('border-transparent font-medium', isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-950'),
                )}
              >
                {status.label}
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Đang tải đơn hàng">
            {[0, 1, 2].map((i) => <div key={i} className={cn('h-44 animate-pulse rounded-lg border', panel)} />)}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            <button onClick={fetchData} className="mt-3 text-sm font-semibold text-stone-950 underline dark:text-white">Thử lại</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className={cn('flex flex-col items-start gap-3 rounded-lg border p-10', panel)}>
            <HiOutlineShoppingBag className={cn('h-10 w-10', muted)} />
            <p className={cn('text-lg font-semibold', ink)}>Chưa có đơn hàng nào trong mục này</p>
            <Link to="/products" className={cn('rounded-md px-4 py-2.5 text-sm font-bold', isDark ? 'bg-white text-stone-950' : 'bg-stone-950 text-white')}>
              Xem sản phẩm
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderItemCard
                key={order.id}
                order={order}
                isDark={isDark}
                formatCurrency={formatOrderCurrency}
                formatDate={formatOrderDate}
                canMarkReceived={canMarkReceived}
                onMarkReceived={handleMarkReceived}
                onReport={(targetOrder) => setReportingOrder(targetOrder)}
              />
            ))}
          </div>
        )}

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
