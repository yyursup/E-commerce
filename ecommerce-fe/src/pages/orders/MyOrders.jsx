import { useState, useEffect } from 'react'
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

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
          Vui lòng đăng nhập để xem đơn hàng
        </p>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl">
        {/* Header & Escrow Summary */}
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
          <div
            className={cn(
              'flex items-center gap-4 px-5 py-4 rounded-2xl shadow-sm border',
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200',
            )}
          >
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <HiOutlineCreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Ký Quỹ Đang Bảo Vệ (Escrow)
              </p>
              <p className={cn('text-xl font-bold font-mono text-amber-600 dark:text-amber-400', isDark ? 'text-amber-400' : 'text-amber-600')}>
                {formatOrderCurrency(statusFilter === '' ? escrowHeld : walletBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
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
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300',
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
            <p className={cn('text-sm font-medium', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div
            className={cn(
              'rounded-3xl border p-12 text-center',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <HiOutlineShoppingBag className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-300')} />
            <p className={cn('mt-4 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Bạn chưa có đơn hàng nào trong mục này
            </p>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
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
