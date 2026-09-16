import { useState, useEffect, useMemo } from 'react'
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
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import orderService from '../../services/order'
import ShopOrderCard from './components/order/ShopOrderCard'
import ShopOrderTabs from './components/order/ShopOrderTabs'
import { formatCurrency } from './components/order/orderHelpers'

export default function ShopOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('NEWEST')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    fetchOrders()
  }, [isAuthenticated])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const ordersData = await orderService.getShopOrders(null)
      setOrders(ordersData || [])
    } catch (err) {
      console.error('Error fetching shop orders:', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách đơn hàng'
      setError(msg)
      toast.error(msg, { id: 'fetch-orders-error' })
    } finally {
      setLoading(false)
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

  // Metric Calculations
  const metrics = useMemo(() => {
    let totalCount = orders.length
    let pendingProcessingCount = 0
    let shippingCount = 0
    let completedCount = 0
    let totalDeliveredRevenue = 0

    orders.forEach((o) => {
      if (['CONFIRMED', 'PROCESSING'].includes(o.status)) {
        pendingProcessingCount++
      } else if (['SHIPPING', 'SHIPPED'].includes(o.status)) {
        shippingCount++
      } else if (['DELIVERED', 'COMPLETED'].includes(o.status)) {
        completedCount++
        totalDeliveredRevenue += Number(o.total || 0)
      }
    })

    return {
      totalCount,
      pendingProcessingCount,
      shippingCount,
      completedCount,
      totalDeliveredRevenue,
    }
  }, [orders])

  // Filter Tabs Definition with Dynamic Counts
  const tabs = useMemo(() => {
    const counts = {
      ALL: orders.length,
      PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
      PROCESSING: orders.filter((o) => ['CONFIRMED', 'PROCESSING', 'PENDING'].includes(o.status)).length,
      SHIPPING: orders.filter((o) => ['SHIPPING', 'SHIPPED'].includes(o.status)).length,
      DELIVERED: orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status)).length,
      CANCELLED: orders.filter((o) => ['CANCELLED', 'REFUNDED'].includes(o.status)).length,
    }

    return [
      { id: 'ALL', label: 'Tất cả', count: counts.ALL },
      { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán', count: counts.PENDING_PAYMENT },
      { id: 'PROCESSING', label: 'Cần xử lý & Đóng gói', count: counts.PROCESSING, highlight: counts.PROCESSING > 0 },
      { id: 'SHIPPING', label: 'Đang giao GHN', count: counts.SHIPPING },
      { id: 'DELIVERED', label: 'Đã giao thành công', count: counts.DELIVERED },
      { id: 'CANCELLED', label: 'Đã hủy / Hoàn tiền', count: counts.CANCELLED },
    ]
  }, [orders])

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // 1. Tab Filter
    if (selectedTab === 'PENDING_PAYMENT') {
      result = result.filter((o) => o.status === 'PENDING_PAYMENT')
    } else if (selectedTab === 'PROCESSING') {
      result = result.filter((o) => ['CONFIRMED', 'PROCESSING', 'PENDING'].includes(o.status))
    } else if (selectedTab === 'SHIPPING') {
      result = result.filter((o) => ['SHIPPING', 'SHIPPED'].includes(o.status))
    } else if (selectedTab === 'DELIVERED') {
      result = result.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status))
    } else if (selectedTab === 'CANCELLED') {
      result = result.filter((o) => ['CANCELLED', 'REFUNDED'].includes(o.status))
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((o) => {
        const orderNum = (o.orderNumber || '').toLowerCase()
        const userName = (o.userName || o.shippingName || '').toLowerCase()
        const phone = (o.shippingPhone || '').toLowerCase()
        const ghnCode = (o.ghnOrderCode || '').toLowerCase()
        const productMatch = o.items?.some((it) => (it.productName || '').toLowerCase().includes(q))
        return orderNum.includes(q) || userName.includes(q) || phone.includes(q) || ghnCode.includes(q) || productMatch
      })
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      } else if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      } else if (sortBy === 'PRICE_DESC') {
        return Number(b.total || 0) - Number(a.total || 0)
      } else if (sortBy === 'PRICE_ASC') {
        return Number(a.total || 0) - Number(b.total || 0)
      }
      return 0
    })

    return result
  }, [orders, selectedTab, searchQuery, sortBy])

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
            Quản Lý Đơn Hàng
          </h1>
          <p className={cn('mt-1 text-xs sm:text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Theo dõi tiến trình xử lý đơn, bàn giao vận chuyển GHN và đối soát doanh thu
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95',
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
          )}
        >
          <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin text-amber-500')} />
          <span>{loading ? 'Đang làm mới...' : 'Làm mới'}</span>
        </button>
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
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
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
        onSelectTab={setSelectedTab}
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
              'w-full rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
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
            onChange={(e) => setSortBy(e.target.value)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
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
                setSelectedTab('ALL')
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-600 transition-all active:scale-95"
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
        </div>
      )}
    </div>
  )
}
