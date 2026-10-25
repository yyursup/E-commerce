import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineShoppingBag,
  HiOutlineDocumentReport,
  HiOutlineRefresh,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import orderService from '../../services/order'
import { ADMIN_ORDER_STATUSES } from './components/order/orderHelpers'
import AdminOrderListCard from './components/order/AdminOrderListCard'
import AdminExportSettlementModal from './components/order/AdminExportSettlementModal'
import AdminShopListTable from './components/order/AdminShopListTable'

export default function AdminOrders() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') === 'all-orders' ? 'all-orders' : 'shops'
  const [activeTab, setActiveTab] = useState(currentTab)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const paramTab = searchParams.get('tab') === 'all-orders' ? 'all-orders' : 'shops'
    setActiveTab(paramTab)
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'all-orders') return
    fetchOrders()
  }, [isAuthenticated, activeTab, statusFilter])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

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
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Title */}
        <div>
          <h1 className={cn('text-3xl font-black tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
            Quản lý Gian hàng & Đơn hàng
          </h1>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Theo dõi hiệu suất kinh doanh, quỹ bảo chứng ký quỹ và kiểm tra toàn bộ đơn hàng trên hệ thống
          </p>
        </div>

        {/* Tab Switcher: Gian hàng & Hiệu suất | Tất cả đơn hàng */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => handleTabChange('shops')}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border',
              activeTab === 'shops'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineOfficeBuilding className="h-4 w-4" />
            <span>Gian Hàng & Hiệu Suất</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all-orders')}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border',
              activeTab === 'all-orders'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineShoppingBag className="h-4 w-4" />
            <span>Tất Cả Đơn Hàng Toàn Sàn</span>
          </button>
        </div>

        {/* TAB 1: GIAN HÀNG & HIỆU SUẤT */}
        {activeTab === 'shops' && <AdminShopListTable isDark={isDark} />}

        {/* TAB 2: TẤT CẢ ĐƠN HÀNG */}
        {activeTab === 'all-orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium',
                    'focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-stone-300 bg-white text-stone-900',
                  )}
                >
                  {ADMIN_ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={fetchOrders}
                  disabled={loading}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95',
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  )}
                >
                  <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin text-amber-500')} />
                  <span>Làm mới</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                disabled={orders.length === 0}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 border',
                  isDark
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                )}
              >
                <HiOutlineDocumentReport className="h-4 w-4 text-amber-500" />
                <span>Xuất Báo Cáo Đối Soát Toàn Sàn (Excel/CSV)</span>
              </button>
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
        )}
      </div>

      {/* Admin Export Settlement Modal */}
      <AdminExportSettlementModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        orders={orders}
        isDark={isDark}
      />
    </div>
  )
}
