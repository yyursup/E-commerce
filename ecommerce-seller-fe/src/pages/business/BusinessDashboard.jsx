import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineX,
  HiOutlineLockClosed,
  HiOutlineTrash,
  HiOutlineTrendingUp,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import sellerService from '../../services/seller'
import statisticsService from '../../services/statistics'
import walletService from '../../services/wallet'
import SellerProductCard from './components/SellerProductCard'
import OrderStatusSummary from './components/OrderStatusSummary'
import ProductFormModal from './components/ProductFormModal'
import ProductDetailModal from './components/ProductDetailModal'

export default function BusinessDashboard() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [error, setError] = useState(null)
  const [timelineFilter, setTimelineFilter] = useState('14d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const fetchDashboardData = async (filter = timelineFilter, start = customStartDate, end = customEndDate) => {
    try {
      setLoading(true)
      setError(null)

      const params = { period: filter }
      if (filter === 'custom' && start && end) {
        params.startDate = start
        params.endDate = end
      }

      const [analyticsData, walletData, productsData] = await Promise.all([
        statisticsService.getSellerDashboardAnalytics(params).catch((err) => {
          console.warn('Analytics API error fallback:', err)
          return null
        }),
        walletService.getMyWallet().catch(() => null),
        sellerService.getProductsByShop(statusFilter || null).catch(() => []),
      ])

      setAnalytics(analyticsData)
      setWallet(walletData)

      const transformedProducts = (productsData || []).map((product) => {
        const thumbnailImage = product.images?.find((img) => img.isThumbnail) || product.images?.[0]
        const imageUrl = thumbnailImage?.imageUrl || thumbnailImage || null

        return {
          id: product.id,
          name: product.name,
          price: product.basePrice ? Number(product.basePrice) : 0,
          stock: product.quantity || 0,
          status: product.status?.toUpperCase() || 'PUBLISHED',
          sku: product.sku,
          description: product.description,
          categoryId: product.categoryId,
          images: product.images || [],
          image: imageUrl,
          variants: product.variants || [],
          conditionGrade: product.conditionGrade,
          warrantyType: product.warrantyType,
        }
      })
      setProducts(transformedProducts)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Không thể tải toàn bộ dữ liệu thống kê')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod) => {
    setTimelineFilter(newPeriod)
    if (newPeriod === 'custom') {
      setIsCustomDateOpen(true)
    } else {
      setIsCustomDateOpen(false)
      fetchDashboardData(newPeriod)
    }
  }

  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Vui lòng chọn đầy đủ từ ngày và đến ngày')
      return
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Từ ngày không được lớn hơn đến ngày')
      return
    }
    fetchDashboardData('custom', customStartDate, customEndDate)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [statusFilter])

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return
    }

    try {
      await sellerService.deleteProduct(productId)
      toast.success('Đã xóa sản phẩm thành công')
      fetchDashboardData()
    } catch (err) {
      console.error('Error deleting product:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa sản phẩm'
      toast.error(errorMessage)
    }
  }

  const handleViewProduct = (product) => {
    setSelectedProduct(product)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleFormClose = () => {
    setShowProductForm(false)
    setEditingProduct(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    fetchDashboardData()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)
  }

  const salesTimeline = analytics?.salesTimeline || []
  const maxSalesVal = Math.max(...salesTimeline.map((d) => Number(d.revenue || 0)), 500000)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={cn('text-3xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
              {analytics?.shopName || 'Dashboard Doanh Nghiệp'}
            </h1>
            {analytics?.isKycVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                <HiOutlineShieldCheck className="h-3.5 w-3.5" /> Shop Đã Xác Minh
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
                Chưa hoàn tất eKYC
              </span>
            )}
          </div>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            Báo cáo hiệu quả kinh doanh, dòng tiền Escrow và quản lý danh mục thiết bị công nghệ
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition shadow-sm self-start sm:self-auto',
            isDark
              ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
              : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700',
          )}
        >
          <HiOutlineRefresh className={cn('h-4 w-4', loading && 'animate-spin')} />
          Cập nhật số liệu
        </button>
      </div>

      {/* BỘ LỌC KỲ THỜI GIAN CHO SHOP DASHBOARD */}
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-4 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white',
        )}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Kỳ thống kê:
          </span>
          <div
            className={cn(
              'flex items-center rounded-xl p-1 border text-xs font-semibold',
              isDark ? 'border-slate-800 bg-slate-800/60' : 'border-stone-200 bg-stone-100',
            )}
          >
            {[
              { id: '7d', label: '7 ngày' },
              { id: '14d', label: '14 ngày' },
              { id: '30d', label: '30 ngày' },
              { id: 'this_month', label: 'Tháng này' },
              { id: 'last_month', label: 'Tháng trước' },
              { id: 'custom', label: 'Tùy chọn' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-all',
                  timelineFilter === p.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-stone-600 hover:text-stone-900',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {analytics?.startDate && analytics?.endDate && (
            <span
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-lg font-semibold border',
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-stone-50 border-stone-200 text-stone-600',
              )}
            >
              {analytics.startDate} → {analytics.endDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Dữ liệu KPI & biểu đồ được tính toán theo kỳ đã chọn</span>
        </div>
      </div>

      {/* Ô nhập ngày tùy chọn */}
      {isCustomDateOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn(
            'p-4 rounded-xl border flex flex-wrap items-center gap-3 text-xs',
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-stone-50',
          )}
        >
          <span className="font-semibold text-slate-400">Chọn khoảng ngày:</span>
          <div className="flex items-center gap-2">
            <span>Từ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg border text-xs',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-800',
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <span>Đến:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg border text-xs',
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-800',
              )}
            />
          </div>
          <button
            onClick={handleApplyCustomDate}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Áp dụng
          </button>
        </motion.div>
      )}

      {/* 1. KHỐI THẺ CHỈ SỐ KINH DOANH TRỌNG ĐIỂM (KPIS) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thu nhập thực nhận */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Thu Nhập Thực Nhận (Net)
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                Trong kỳ
              </span>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <HiOutlineCurrencyDollar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-500">
              {formatCurrency(analytics?.settledNetIncome)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium">
              {analytics?.revenueGrowthRate != null ? (
                <>
                  <span className={analytics.revenueGrowthRate >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                    {analytics.revenueGrowthRate >= 0 ? `↑ +${analytics.revenueGrowthRate}%` : `↓ ${analytics.revenueGrowthRate}%`}
                  </span>
                  <span className={isDark ? 'text-slate-500' : 'text-stone-400'}>so với cùng kỳ trước</span>
                </>
              ) : (
                <span className="text-emerald-500 font-semibold">Mới phát sinh trong kỳ</span>
              )}
            </div>
            {analytics?.allTimeRevenue != null && (
              <p className={cn("text-[11px] mt-1.5 truncate", isDark ? "text-slate-400" : "text-stone-500")}>
                Lũy kế toàn thời gian: <span className="font-semibold">{formatCurrency(analytics.allTimeRevenue)}</span>
              </p>
            )}
          </div>
        </motion.div>

        {/* Tiền đang tạm giữ Escrow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Doanh Thu Đang Chờ (Escrow)
              </span>
              <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                Thời gian thực
              </span>
            </div>
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
              <HiOutlineLockClosed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-purple-500">
              {formatCurrency(analytics?.pendingEscrowRevenue)}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đang giao & chờ khách đồng kiểm
            </p>
            <p className={cn("text-[11px] mt-1.5 truncate text-purple-400/80")}>
              Sẽ giải ngân vào Ví sau 3 ngày
            </p>
          </div>
        </motion.div>

        {/* Giá trị đơn trung bình (AOV) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Giá Trị Đơn TB (AOV)
              </span>
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20">
                Trong kỳ
              </span>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <HiOutlineTrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-blue-500">
              {formatCurrency(analytics?.averageOrderValue)}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Trên tổng {analytics?.completedOrders || 0} đơn hoàn thành trong kỳ
            </p>
          </div>
        </motion.div>

        {/* Tỷ lệ hoàn tất & trả hàng */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            'rounded-2xl border p-5 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Hiệu Suất Giao Hàng
              </span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                Trong kỳ
              </span>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <HiOutlineCheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-emerald-500">
                {analytics?.fulfillmentRate || 0}%
              </p>
              <span className="text-xs text-slate-400">hoàn tất ({analytics?.completedOrders || 0} đơn)</span>
            </div>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tỷ lệ hoàn hàng: <span className="font-semibold text-rose-400">{analytics?.returnRate || 0}% ({analytics?.returnedOrders || 0} đơn)</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* 2. VÍ TIỀN SHOP & CẢNH BÁO TỒN KHO NGUY CẤP */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card Ví Tiền */}
        {wallet && (
          <div
            className={cn(
              'rounded-2xl border p-6 shadow-sm flex flex-col justify-between',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  Số Dư Ví Cửa Hàng
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20">
                  {wallet.currency || 'VND'}
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Khả dụng rút tiền:
                  </span>
                  <span className="font-bold text-lg text-emerald-500">
                    {formatCurrency(wallet.availableBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Đang khóa bảo lãnh:
                  </span>
                  <span className="font-semibold text-sm text-purple-400">
                    {formatCurrency(wallet.lockedBalance)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/40 text-[11px] text-slate-500">
              Tiền sẽ tự động giải ngân sau 3 ngày kể từ khi khách nhận hàng nếu không có khiếu nại.
            </div>
          </div>
        )}

        {/* Cảnh báo tồn kho nguy cấp (< 3 cái) */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm lg:col-span-2',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineExclamationCircle className="h-5 w-5 text-amber-500" />
              <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Cảnh Báo Tồn Kho Thấp (Sắp Hết Hàng)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Số lượng còn lại ≤ 3 máy/linh kiện</span>
          </div>

          {(analytics?.lowStockAlerts || []).length === 0 ? (
            <div className="py-6 text-center text-sm text-emerald-400">
              ✓ Toàn bộ kho hàng thiết bị đều đảm bảo số lượng tồn an toàn!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {analytics.lowStockAlerts.map((item) => (
                <div
                  key={item.productId}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3 text-xs',
                    isDark ? 'border-slate-800 bg-slate-950/60' : 'border-amber-100 bg-amber-50/50',
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                        <HiOutlineCube className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold truncate text-slate-200">{item.productName}</p>
                      <span className="text-[10px] text-amber-400">{item.conditionGradeLabel}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-extrabold text-rose-500 border border-rose-500/20">
                      Còn {item.remainingStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. BIỂU ĐỒ DOANH THU THEO CHU KỲ */}
      <div
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                Doanh Số Bán Hàng Theo Chu Kỳ
              </h2>
              {analytics?.startDate && analytics?.endDate && (
                <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-semibold', isDark ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600')}>
                  {analytics.startDate} → {analytics.endDate}
                </span>
              )}
            </div>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Theo dõi biến động dòng tiền bán lẻ thiết bị công nghệ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex text-xs font-semibold text-emerald-400 items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Doanh thu trong kỳ
            </span>
          </div>
        </div>

        {/* Thanh hiển thị chi tiết số liệu khi rê chuột - CỐ ĐỊNH CHIỀU CAO 44px KHÔNG BAO GIỜ THAY ĐỔI */}
        <div
          className={cn(
            'mb-4 h-11 min-h-[44px] max-h-[44px] px-3.5 rounded-xl border text-xs flex items-center justify-between overflow-hidden select-none transition-colors duration-150',
            hoveredPoint
              ? isDark
                ? 'bg-emerald-950/40 border-emerald-800/60 text-white'
                : 'bg-emerald-50/90 border-emerald-200 text-stone-900'
              : isDark
              ? 'bg-slate-800/40 border-slate-800 text-slate-400'
              : 'bg-stone-50 border-stone-200 text-stone-600',
          )}
        >
          {hoveredPoint ? (
            <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 font-bold text-emerald-500 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ngày {hoveredPoint.date}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar shrink-0">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Doanh số bán:</span>
                  <strong className="font-bold text-emerald-500">{formatCurrency(Number(hoveredPoint.revenue || 0))}</strong>
                </span>
                <span className={cn('h-3 w-px shrink-0', isDark ? 'bg-slate-700' : 'bg-stone-300')}></span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className={isDark ? 'text-slate-400' : 'text-stone-500'}>Đơn hoàn thành:</span>
                  <strong className="font-bold text-blue-500">{hoveredPoint.orderCount || 0} đơn</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-1.5 truncate">
                <span>💡</span>
                <span className="truncate">Rê chuột vào cột ngày để xem chi tiết doanh thu và đơn hàng</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-medium">
                <span className="hidden sm:inline">Tổng doanh thu:</span>
                <strong className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                  {formatCurrency(salesTimeline.reduce((acc, d) => acc + Number(d.revenue || 0), 0))}
                </strong>
                <span>•</span>
                <span>{salesTimeline.reduce((acc, d) => acc + Number(d.orderCount || 0), 0)} đơn</span>
              </div>
            </div>
          )}
        </div>

        {salesTimeline.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Chưa có giao dịch phát sinh trong 14 ngày qua</div>
        ) : (
          <div className="relative flex h-60 min-h-[240px] max-h-[240px] items-stretch gap-2 overflow-x-auto overflow-y-hidden pt-12 pb-2">
            {salesTimeline.map((item, idx) => {
              const revNum = Number(item.revenue || 0)
              const height = revNum > 0 ? Math.max((revNum / maxSalesVal) * 100, 3) : 0
              const shortDate = item.date ? item.date.slice(5) : ''
              const isHovered = hoveredPoint?.date === item.date

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredPoint(item)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className={cn(
                    'group relative flex h-full min-w-[44px] flex-1 flex-col items-center justify-end gap-1.5 cursor-pointer rounded-xl px-1 py-1 transition-colors duration-100',
                    isHovered
                      ? isDark
                        ? 'bg-slate-800/80 shadow-sm'
                        : 'bg-emerald-50/80 shadow-sm'
                      : hoveredPoint
                      ? 'opacity-40 hover:opacity-100'
                      : 'hover:bg-slate-500/5',
                  )}
                >
                  {/* Tooltip nổi phía trên cột - cố định vị trí, không animation giật */}
                  <div
                    className={cn(
                      'pointer-events-none absolute -top-11 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-xl transition-opacity duration-100 border',
                      isHovered
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none',
                      isDark
                        ? 'bg-slate-900/95 text-white border-slate-700 backdrop-blur-md'
                        : 'bg-stone-900/95 text-white border-stone-800 backdrop-blur-md',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="text-slate-300">Doanh thu:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(Number(item.revenue || 0))}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {item.date} ({item.orderCount || 0} đơn)
                    </div>
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-stone-900 dark:border-t-slate-900" />
                  </div>

                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={cn(
                        'w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-colors duration-100',
                        isHovered ? 'from-emerald-500 to-teal-200' : 'group-hover:from-emerald-500 group-hover:to-teal-300',
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold truncate transition-colors duration-100',
                      isHovered
                        ? 'text-emerald-500'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-stone-500',
                    )}
                  >
                    {shortDate}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. TOP SẢN PHẨM BÁN CHẠY & PHÂN BỔ TÌNH TRẠNG MÁY */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Sản phẩm bán chạy */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="border-b pb-3 mb-4">
            <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Top 5 Sản Phẩm Bán Chạy Nhất
            </h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Xếp hạng theo số lượng đã giao thành công
            </p>
          </div>

          {(analytics?.topProducts || []).length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu sản phẩm đã bán</div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {analytics.topProducts.map((p, idx) => (
                <div key={p.productId || idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-500 shrink-0">
                      {idx + 1}
                    </div>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="truncate">
                      <p className={cn('font-semibold text-sm truncate', isDark ? 'text-white' : 'text-stone-900')}>
                        {p.productName}
                      </p>
                      <span className="text-[11px] text-amber-400">{p.conditionGradeLabel}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold text-sm text-emerald-500">{formatCurrency(p.revenue)}</p>
                    <p className="text-[11px] text-slate-400">Đã bán: {p.soldQuantity} cái</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cơ cấu doanh thu theo Condition Grade */}
        <div
          className={cn(
            'rounded-2xl border p-6 shadow-sm',
            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
          )}
        >
          <div className="border-b pb-3 mb-4">
            <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Tỷ Trọng Doanh Thu Theo Tình Trạng Hàng
            </h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tỷ lệ đóng góp doanh số giữa Mới Seal, Like New và Xác máy As-is
            </p>
          </div>

          <div className="space-y-4">
            {(analytics?.conditionSalesBreakdown || []).map((grade) => (
              <div key={grade.conditionGrade} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn('font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>
                    {grade.label}
                  </span>
                  <span className={cn('font-bold', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                    {formatCurrency(grade.totalRevenue)} ({grade.percentage || 0}%)
                  </span>
                </div>
                <div className={cn('h-2 w-full rounded-full overflow-hidden', isDark ? 'bg-slate-800' : 'bg-stone-200')}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(grade.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. PHỄU TRẠNG THÁI ĐƠN HÀNG */}
      <OrderStatusSummary
        isDark={isDark}
        orderCountByStatus={analytics?.orderCountByStatus || {}}
        totalOrders={analytics?.totalOrders || 0}
      />

      {/* 6. QUẢN LÝ SẢN PHẨM CỦA SHOP (GIỮ NGUYÊN TÍNH NĂNG GỐC) */}
      <div
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Quản Lý Kho Hàng Của Shop
            </h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tổng số {products.length} sản phẩm đang có trong hệ thống
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-medium',
                isDark
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-stone-300 bg-white text-stone-900',
              )}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đang bán</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
            <button
              onClick={handleCreateProduct}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition shadow-sm',
                'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
              )}
            >
              <HiOutlinePlusCircle className="h-5 w-5" />
              Thêm sản phẩm
            </button>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <SellerProductCard
                  product={product}
                  onView={() => handleViewProduct(product)}
                  onEdit={() => handleEditProduct(product)}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <HiOutlineCube className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-400')} />
            <p className={cn('mt-4 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
              Chưa có sản phẩm nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={(prod) => {
            setSelectedProduct(null)
            setEditingProduct(prod)
            setShowProductForm(true)
          }}
        />
      )}
    </div>
  )
}
