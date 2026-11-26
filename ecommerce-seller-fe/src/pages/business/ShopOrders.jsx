import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineFilter,
  HiOutlineDocumentReport,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import orderService from '../../services/order'
import ShopOrderCard from './components/order/ShopOrderCard'
import ShopOrderTabs from './components/order/ShopOrderTabs'
import ExportSettlementModal from './components/order/ExportSettlementModal'
import { formatCurrency } from './components/order/orderHelpers'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 10

export const TAB_STATUSES = {
  ALL: [],
  PENDING_PAYMENT: ['PENDING_PAYMENT'],
  PROCESSING: ['CONFIRMED', 'PROCESSING', 'PENDING'],
  SHIPPING: ['SHIPPING', 'SHIPPED'],
  DELIVERED: ['DELIVERED', 'COMPLETED'],
  CANCELLED: ['CANCELLED', 'REFUNDED'],
}

const SORT_PARAM = {
  NEWEST: 'createdAt,desc',
  OLDEST: 'createdAt,asc',
  PRICE_DESC: 'total,desc',
  PRICE_ASC: 'total,asc',
}

// summary: [{ status, count, total }] từ /order/shops/summary
export function buildOrderStats(summary = []) {
  const count = (statuses) =>
    summary.filter((r) => statuses.includes(r.status)).reduce((n, r) => n + Number(r.count || 0), 0)
  const all = summary.reduce((n, r) => n + Number(r.count || 0), 0)
  const deliveredRevenue = summary
    .filter((r) => TAB_STATUSES.DELIVERED.includes(r.status))
    .reduce((n, r) => n + Number(r.total || 0), 0)

  const processing = count(TAB_STATUSES.PROCESSING)
  const metrics = {
    totalCount: all,
    pendingProcessingCount: count(['CONFIRMED', 'PROCESSING']),
    shippingCount: count(TAB_STATUSES.SHIPPING),
    completedCount: count(TAB_STATUSES.DELIVERED),
    totalDeliveredRevenue: deliveredRevenue,
  }
  const tabs = [
    { id: 'ALL', label: 'Tất cả', count: all },
    { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán', count: count(TAB_STATUSES.PENDING_PAYMENT) },
    { id: 'PROCESSING', label: 'Cần xử lý & Đóng gói', count: processing, highlight: processing > 0 },
    { id: 'SHIPPING', label: 'Đang giao GHN', count: count(TAB_STATUSES.SHIPPING) },
    { id: 'DELIVERED', label: 'Đã giao thành công', count: count(TAB_STATUSES.DELIVERED) },
    { id: 'CANCELLED', label: 'Đã hủy / Hoàn tiền', count: count(TAB_STATUSES.CANCELLED) },
  ]
  return { metrics, tabs }
}

export default function ShopOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState('NEWEST')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOrders, setExportOrders] = useState([])
  const [loadingExport, setLoadingExport] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  // Chờ người dùng gõ xong mới gọi server
  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchQuery.trim()
      if (q === debouncedQuery) return
      setDebouncedQuery(q)
      setPage(0)
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Đổi bộ lọc thì quay về trang đầu (đặt cùng lúc để chỉ gọi API một lần)
  const selectTab = (tab) => {
    setSelectedTab(tab)
    setPage(0)
  }
  const changeSort = (value) => {
    setSortBy(value)
    setPage(0)
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchOrders()
  }, [isAuthenticated, selectedTab, debouncedQuery, sortBy, page])

  const fetchOrders = async () => {
    const requestId = ++requestIdRef.current
    try {
      setLoading(true)
      setError(null)
      const [pageData, summaryData] = await Promise.all([
        orderService.getShopOrdersPaged({
          page,
          size: PAGE_SIZE,
          statuses: TAB_STATUSES[selectedTab],
          q: debouncedQuery,
          sort: SORT_PARAM[sortBy],
        }),
        orderService.getShopOrderSummary().catch(() => null),
      ])
      if (requestId !== requestIdRef.current) return // bỏ kết quả của lần gọi cũ
      setOrders(pageData?.content || [])
      setTotalPages(pageData?.totalPages || 0)
      setTotalElements(pageData?.totalElements || 0)
      if (Array.isArray(summaryData)) setSummary(summaryData)
    } catch (err) {
      console.error('Error fetching shop orders:', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách đơn hàng'
      setError(msg)
      toast.error(msg, { id: 'fetch-orders-error' })
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  // Báo cáo đối soát cần toàn bộ đơn nên tải riêng khi mở modal
  const openExportModal = async () => {
    try {
      setLoadingExport(true)
      const all = await orderService.getShopOrders(null)
      setExportOrders(all || [])
      setShowExportModal(true)
    } catch (err) {
      toast.error(err?.message || 'Không thể tải đơn hàng để đối soát')
    } finally {
      setLoadingExport(false)
    }
  }

  // Quick Action on Card
  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    try {
      setActionLoading(true)
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success('Đã cập nhật trạng thái đơn hàng thành công!', { id: 'quick-status-update' })
      await fetchOrders()
    } catch (err) {
      console.error('Update status error:', err)
      toast.error(err?.message || 'Cập nhật trạng thái thất bại', { id: 'quick-status-error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Số liệu & số đếm từng tab lấy từ thống kê server (toàn bộ đơn, không chỉ trang hiện tại)
  const { metrics, tabs } = useMemo(() => buildOrderStats(summary), [summary])

  const filteredOrders = orders

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-[70vh] flex items-center justify-center p-6', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="text-center space-y-3">
          <HiOutlineShoppingBag className="mx-auto h-12 w-12 text-stone-400" />
          <p className={cn('text-base font-semibold', isDark ? 'text-slate-300' : 'text-stone-700')}>
            Vui lòng đăng nhập để xem danh sách đơn hàng của shop
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl sm:text-3xl font-black tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản lý đơn hàng
          </h1>
          <p className={cn('mt-1 text-xs sm:text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Theo dõi tiến trình xử lý đơn, bàn giao vận chuyển GHN và đối soát doanh thu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openExportModal}
            disabled={loadingExport || totalElements === 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95',
              isDark
                ? 'hover:bg-amber-500/20 bg-slate-800 text-white border-white'
                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
            )}
          >
            <HiOutlineDocumentReport className="h-4 w-4 text-amber-500" />
            <span>{loadingExport ? 'Đang tải đơn...' : 'Xuất báo cáo đối soát'}</span>
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-bold transition-all active:scale-95',
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
            )}
          >
            <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin text-amber-500')} />
            <span>{loading ? 'Đang làm mới...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Banner (Responsive 4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Cần xử lý */}
        <div
          className={cn(
            'p-4 sm:p-5 rounded-2xl border transition-all',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white shadow-sm'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Cần xử lý & Đóng gói</span>
            <span className="p-2 rounded-xl bg-stone-100 text-stone-950">
              <HiOutlineClock className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-500">
              {metrics.pendingProcessingCount}
            </span>
            <span className="text-xs text-stone-400">đơn hàng</span>
          </div>
        </div>

        {/* Metric 2: Đang giao */}
        <div
          className={cn(
            'p-4 sm:p-5 rounded-2xl border transition-all',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white shadow-sm'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Đang giao GHN</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <HiOutlineTruck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-500">
              {metrics.shippingCount}
            </span>
            <span className="text-xs text-stone-400">đơn hàng</span>
          </div>
        </div>

        {/* Metric 3: Đã giao thành công */}
        <div
          className={cn(
            'p-4 sm:p-5 rounded-2xl border transition-all',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white shadow-sm'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Đã giao thành công</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <HiOutlineCheckCircle className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-500">
              {metrics.completedCount}
            </span>
            <span className="text-xs text-stone-400">đơn hoàn tất</span>
          </div>
        </div>

        {/* Metric 4: Doanh thu thực nhận */}
        <div
          className={cn(
            'p-4 sm:p-5 rounded-2xl border transition-all',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white shadow-sm'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Doanh thu giao thành công</span>
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <HiOutlineCurrencyDollar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-orange-500 truncate">
              {formatCurrency(metrics.totalDeliveredRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Status Tabs (Wheel & Drag Scrollable Pill Bar) */}
      <ShopOrderTabs
        tabs={tabs}
        selectedTab={selectedTab}
        onSelectTab={selectTab}
        isDark={isDark}
      />

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-lg">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã đơn, Tên người nhận, SĐT, Mã GHN, Tên sản phẩm..."
            className={cn(
              'w-full rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40',
              isDark
                ? 'border-slate-800 bg-slate-900 text-white placeholder:text-slate-500'
                : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 shadow-sm'
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-white"
            >
              <HiOutlineX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <HiOutlineFilter className="h-4 w-4 text-stone-400 shrink-0 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => changeSort(e.target.value)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-stone-950/30 dark:focus:ring-white/40',
              isDark
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-stone-200 bg-white text-stone-800 shadow-sm'
            )}
          >
            <option value="NEWEST">Mới nhất trước</option>
            <option value="OLDEST">Cũ nhất trước</option>
            <option value="PRICE_DESC">Giá trị cao nhất</option>
            <option value="PRICE_ASC">Giá trị thấp nhất</option>
          </select>
        </div>
      </div>

      {/* 5. Error Alert */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center">
          <p className="text-sm font-medium text-rose-500">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 underline hover:no-underline"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {/* 6. Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'animate-pulse rounded-2xl border p-6 space-y-4',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 rounded bg-stone-200 dark:bg-slate-800" />
                <div className="h-6 w-24 rounded-full bg-stone-200 dark:bg-slate-800" />
              </div>
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-xl bg-stone-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-stone-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/3 rounded bg-stone-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div
          className={cn(
            'rounded-3xl border p-12 sm:p-16 text-center space-y-4',
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-white shadow-sm'
          )}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-950">
            <HiOutlineShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Không tìm thấy đơn hàng nào
            </h3>
            <p className={cn('mt-1 text-xs sm:text-sm max-w-sm mx-auto', isDark ? 'text-slate-400' : 'text-stone-500')}>
              {searchQuery
                ? `Không có kết quả khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm bằng từ khóa khác.`
                : selectedTab !== 'ALL'
                ? 'Không có đơn hàng nào trong mục trạng thái này.'
                : 'Gian hàng của bạn hiện chưa có đơn hàng nào.'}
            </p>
          </div>

          {(searchQuery || selectedTab !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                selectTab('ALL')
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 bg-stone-950 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>
      )}

      {/* 8. Order List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <ShopOrderCard
                key={order.id}
                order={order}
                isDark={isDark}
                actionLoading={actionLoading}
                onQuickStatusUpdate={handleQuickStatusUpdate}
              />
            ))}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="pt-2"><Pagination currentPage={page + 1} totalPages={totalPages} totalItems={totalElements} pageSize={PAGE_SIZE} onPageChange={(p) => setPage(p - 1)} isDark={isDark} /></div>
          )}
        </div>
      )}

      {/* Export Settlement Statement Modal */}
      <ExportSettlementModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        orders={exportOrders}
        shopName={exportOrders[0]?.shopName || orders[0]?.shopName || 'Gian Hàng Của Bạn'}
        isDark={isDark}
      />
    </div>
  )
}
