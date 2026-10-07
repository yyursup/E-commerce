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

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsData, walletData, productsData] = await Promise.all([
        statisticsService.getSellerDashboardAnalytics().catch((err) => {
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
            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Thu Nhập Thực Nhận (Net)
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <HiOutlineCurrencyDollar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-500">
              {formatCurrency(analytics?.settledNetIncome)}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Đã trừ {formatCurrency(analytics?.totalCommissionPaid)} phí sàn
            </p>
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
            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Doanh Thu Đang Chờ (Escrow)
            </span>
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
            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Giá Trị Đơn TB (AOV)
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <HiOutlineTrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-blue-500">
              {formatCurrency(analytics?.averageOrderValue)}
            </p>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Trên tổng {analytics?.completedOrders || 0} đơn hoàn thành
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
            <span className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Hiệu Suất Giao Hàng
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <HiOutlineCheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-emerald-500">
                {analytics?.fulfillmentRate || 0}%
              </p>
              <span className="text-xs text-slate-400">hoàn tất</span>
            </div>
            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Tỷ lệ hoàn hàng: <span className="font-semibold text-rose-400">{analytics?.returnRate || 0}%</span>
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

      {/* 3. BIỂU ĐỒ DOANH THU 14 NGÀY QUA */}
      <div
        className={cn(
          'rounded-2xl border p-6 shadow-sm',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-6">
          <div>
            <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-stone-900')}>
              Doanh Số Bán Hàng 14 Ngày Gần Nhất
            </h2>
            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
              Theo dõi biến động dòng tiền bán lẻ thiết bị công nghệ
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Doanh thu theo ngày
          </span>
        </div>

        {salesTimeline.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Chưa có giao dịch phát sinh trong 14 ngày qua</div>
        ) : (
          <div className="flex h-52 items-stretch gap-2 overflow-x-auto pb-2">
            {salesTimeline.map((item, idx) => {
              const height = Math.max((Number(item.revenue || 0) / maxSalesVal) * 100, 4)
              const shortDate = item.date ? item.date.slice(5) : ''

              return (
                <div key={idx} className="group relative flex h-full min-w-[42px] flex-1 flex-col items-center justify-end gap-1.5">
                  {/* Tooltip */}
                  <div
                    className={cn(
                      'pointer-events-none absolute bottom-full mb-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs opacity-0 shadow-xl transition group-hover:opacity-100',
                      isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-stone-900 text-white',
                    )}
                  >
                    <div className="font-semibold text-emerald-400">{formatCurrency(Number(item.revenue || 0))}</div>
                    <div className="mt-0.5 text-[10px] text-slate-300">
                      {item.date} ({item.orderCount || 0} đơn)
                    </div>
                  </div>

                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-medium truncate', isDark ? 'text-slate-400' : 'text-stone-500')}>
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
                  <span className="font-medium text-slate-300">{grade.label}</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(grade.totalRevenue)} ({grade.percentage || 0}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
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
