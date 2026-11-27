import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineShoppingBag,
  HiOutlineCreditCard,
  HiOutlineDownload,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import OrderReportModal from '../../components/OrderReportModal'
import OrderItemCard from './components/OrderItemCard'
import Pagination from '../../components/Pagination'
import {
  ORDER_STATUSES,
  formatOrderCurrency,
  formatOrderDate,
} from '../../lib/orderStatus'
import { exportMyOrdersCsv } from '../../utils/exportMyOrdersReport'

// Statuses where buyer money is held in system escrow
const ESCROW_HELD_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED']
const PAGE_SIZE = 10

export default function MyOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState(null)
  const [escrowHeld, setEscrowHeld] = useState(0)
  const [reportingOrder, setReportingOrder] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    fetchData()
  }, [isAuthenticated, statusFilter, page])

  const changeStatus = (value) => {
    setStatusFilter(value)
    setPage(0)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [pageData, summary] = await Promise.all([
        orderService.getMyOrdersPaged({ page, size: PAGE_SIZE, statuses: statusFilter ? [statusFilter] : [] }),
        // Số tiền đang giữ ký quỹ tính ở server trên toàn bộ đơn, không phụ thuộc trang đang xem
        orderService.getMyOrderSummary().catch(() => null),
      ])
      setOrders(pageData?.content || [])
      setTotalPages(pageData?.totalPages || 0)

      if (Array.isArray(summary)) {
        const held = summary
          .filter((row) => ESCROW_HELD_STATUSES.includes(row.status))
          .reduce((sum, row) => sum + Number(row.total || 0), 0)
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

  // Xuất toàn bộ đơn của tab đang chọn (không chỉ trang hiện tại)
  const handleExport = async () => {
    try {
      setExporting(true)
      const all = await orderService.getMyOrders(statusFilter || null)
      const label = ORDER_STATUSES.find((s) => s.value === statusFilter)?.label || 'Tất cả'
      exportMyOrdersCsv(all || [], { filterLabel: label })
      toast.success(`Đã xuất ${(all || []).length} đơn hàng`)
    } catch (err) {
      toast.error(err?.message || 'Không thể xuất báo cáo')
    } finally {
      setExporting(false)
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
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || exporting || orders.length === 0}
              className={cn(
                'mt-3 inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-stone-300 text-stone-950 hover:bg-stone-100'
              )}
            >
              <HiOutlineDownload className="h-4 w-4" /> {exporting ? 'Đang xuất...' : 'Xuất báo cáo đối soát (CSV)'}
            </button>
          </div>

          {/* Money currently protected by escrow */}
          <div className="flex min-w-[280px] flex-col gap-1 rounded-lg bg-stone-950 px-5 py-4 text-white dark:border dark:border-slate-800 dark:bg-slate-900">
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-stone-400">
              <HiOutlineCreditCard className="h-4 w-4" /> Đang giữ trong ký quỹ
            </span>
            <strong className="font-mono text-2xl font-semibold">
              {formatOrderCurrency(escrowHeld)}
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
                onClick={() => changeStatus(status.value)}
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
            <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} isDark={isDark} />
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
