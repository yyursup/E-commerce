import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  HiOutlineArrowLeft,
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineBadgeCheck,
  HiOutlineCash,
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlinePencilAlt,
  HiOutlineMinusCircle,
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineArrowNarrowRight,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineCreditCard,
  HiOutlineLocationMarker,
  HiOutlineTruck,
  HiOutlineDocumentText,
} from 'react-icons/hi'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'
import shopService from '../../services/shop'
import orderService from '../../services/order'
import trustConfigService from '../../services/trustConfig'
import statisticsService from '../../services/statistics'
import { ADMIN_ORDER_STATUSES } from './components/order/orderHelpers'
import { getOrderStatusBadge, getOrderStatusLabel } from '../../lib/orderStatus'
import Pagination from './components/order/Pagination'
import AdjustFundModal from './components/escrow-fund/modals/AdjustFundModal'
import DeductCompensationModal from './components/escrow-fund/modals/DeductCompensationModal'
import FundLedgerModal from './components/escrow-fund/modals/FundLedgerModal'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function formatShortCurrency(amount) {
  const val = Number(amount) || 0
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} tr`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return `${val}đ`
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default function AdminShopDetail() {
  const { shopId } = useParams()
  const navigate = useNavigate()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { isAuthenticated } = useAuthStore()

  // Data states
  const [shop, setShop] = useState(null)
  const [fund, setFund] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [error, setError] = useState(null)

  // Orders filters & pagination
  const [orderStatus, setOrderStatus] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showDeductModal, setShowDeductModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !shopId) return
    loadShopFullData()
  }, [isAuthenticated, shopId])

  useEffect(() => {
    if (!isAuthenticated || !shopId) return
    loadShopOrders()
  }, [isAuthenticated, shopId, orderStatus])

  const loadShopFullData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [shopData, fundData, analyticsData] = await Promise.all([
        shopService.getRawShopById ? shopService.getRawShopById(shopId) : shopService.getShopById(shopId),
        trustConfigService.getFundByShopId(shopId).catch(() => null),
        statisticsService.getAdminShopAnalytics(shopId, { period: '30d' }).catch(() => null),
      ])
      setShop(shopData)
      setFund(fundData)
      setAnalytics(analyticsData)
    } catch (err) {
      console.error('Lỗi tải dữ liệu gian hàng:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin gian hàng')
      toast.error('Không thể tải thông tin gian hàng')
    } finally {
      setLoading(false)
    }
  }

  const loadShopOrders = async () => {
    try {
      setLoadingOrders(true)
      const data = await orderService.getAllOrders(orderStatus || null, shopId)
      setOrders(Array.isArray(data) ? data : [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Lỗi tải đơn hàng của gian hàng:', err)
      toast.error('Không thể tải danh sách đơn hàng')
    } finally {
      setLoadingOrders(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <p className={cn('text-lg', isDark ? 'text-slate-400' : 'text-stone-600')}>
          Vui lòng đăng nhập để xem thông tin gian hàng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('min-h-screen flex flex-col items-center justify-center', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        <p className={cn('mt-4 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
          Đang tải dữ liệu gian hàng và đơn hàng...
        </p>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className={cn('min-h-screen p-8 text-center', isDark ? 'bg-slate-950 text-white' : 'bg-stone-50 text-stone-900')}>
        <div className="mx-auto max-w-md py-16">
          <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-xl font-bold">Không tìm thấy gian hàng</h2>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
            {error || 'Gian hàng không tồn tại hoặc đã bị gỡ bỏ.'}
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-sm"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách gian hàng</span>
          </Link>
        </div>
      </div>
    )
  }

  const stars = Number(shop.trustLevel) || 1
  const isDeficit = fund?.isDeficit === true

  // Filter orders by local search keyword (order code, buyer name, phone)
  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true
    const q = orderSearch.trim().toLowerCase()
    const matchCode = (o.orderNumber || o.id || '').toLowerCase().includes(q)
    const matchBuyer = (o.userName || o.customerName || '').toLowerCase().includes(q)
    const matchPhone = (o.phoneNumber || o.phone || '').includes(q)
    const matchGhn = (o.shippingCode || o.trackingCode || '').toLowerCase().includes(q)
    return matchCode || matchBuyer || matchPhone || matchGhn
  })

  // Pagination for orders
  const totalOrdersCount = filteredOrders.length
  const totalPages = Math.ceil(totalOrdersCount / pageSize) || 1
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Shop modal payload
  const shopModalPayload = {
    shopId: shop.id,
    shopName: shop.name,
    committedAmount: fund?.committedAmount || 0,
    balance: fund?.balance || 0,
    currentTrustLevel: fund?.currentTrustLevel || shop.trustLevel || 1,
  }

  return (
    <div className={cn('min-h-screen px-4 py-8 sm:px-6 lg:px-8', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
            )}
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>← Danh sách tất cả gian hàng</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              loadShopFullData()
              loadShopOrders()
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95',
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            )}
          >
            <HiOutlineRefresh className="h-4 w-4 text-amber-500" />
            <span>Làm mới toàn bộ</span>
          </button>
        </div>

        {/* 1. Header Card: Shop Overview Info & Quick Actions */}
        <div
          className={cn(
            'rounded-2xl border p-6 transition-all shadow-sm space-y-5',
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-stone-200 bg-white'
          )}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Shop Brand & Identity */}
            <div className="flex items-center gap-4">
              <img
                src={shop.logoUrl || '/shop-placeholder.svg'}
                alt={shop.name}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 shrink-0 shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = '/shop-placeholder.svg'
                }}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-stone-900')}>
                    {shop.name}
                  </h1>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                      shop.status === 'ACTIVE'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : shop.status === 'WARNED'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                    )}
                  >
                    {shop.status === 'ACTIVE' ? 'Đang hoạt động' : shop.status === 'WARNED' ? 'Bị cảnh báo' : 'Tạm khóa'}
                  </span>
                  {analytics?.isKycVerified && (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <HiOutlineBadgeCheck className="h-4 w-4" />
                      eKYC Đã Xác Thực
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <HiOutlineStar
                        key={i}
                        className={cn('h-4 w-4', i < stars ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-slate-600')}
                      />
                    ))}
                    <span className="font-bold ml-1.5 text-stone-700 dark:text-slate-200">
                      Bậc {stars} Sao
                    </span>
                  </div>
                  <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                    Số đơn: <strong>{orders.length}</strong> đơn hàng
                  </span>
                  <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                    SĐT: <strong>{shop.phoneNumber || 'N/A'}</strong>
                  </span>
                  {shop.invoiceEmail && (
                    <span className={cn('border-l pl-3', isDark ? 'border-slate-700 text-slate-400' : 'border-stone-300 text-stone-500')}>
                      Email: <strong>{shop.invoiceEmail}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions for Escrow & Fund */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                )}
              >
                <HiOutlinePencilAlt className="h-4 w-4 text-amber-500" />
                <span>Điều chỉnh Quỹ Ký Quỹ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeductModal(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    : 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
                )}
              >
                <HiOutlineMinusCircle className="h-4 w-4 text-rose-500" />
                <span>Trích Đền Bù</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLedgerModal(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                <HiOutlineClipboardList className="h-4 w-4 text-blue-500" />
                <span>Lịch Sử Sổ Cái Ký Quỹ</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Escrow & Financial Overview (Ký quỹ gian hàng & Ký quỹ đơn) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Quỹ bảo chứng Shop */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDeficit
                ? isDark
                  ? 'border-rose-900/50 bg-rose-950/20'
                  : 'border-rose-200 bg-rose-50'
                : isDark
                  ? 'border-slate-800 bg-slate-900/80'
                  : 'border-stone-200 bg-white'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDeficit ? 'text-rose-500' : isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Quỹ Bảo Chứng (Ký Quỹ)
                </p>
                <h3 className={cn('mt-2 text-2xl font-black', isDeficit ? 'text-rose-500' : 'text-emerald-500')}>
                  {formatCurrency(fund?.balance)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Mức cọc yêu cầu: {formatShortCurrency(fund?.committedAmount)} ({isDeficit ? '⚠️ Thiếu hụt' : '✓ Đủ cọc'})
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDeficit
                    ? 'bg-rose-500/20 text-rose-400'
                    : isDark
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-emerald-50 text-emerald-600'
                )}
              >
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Ký quỹ đơn hàng đang giữ */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Ký Quỹ Đơn Đang Giữ
                </p>
                <h3 className="mt-2 text-2xl font-black text-amber-500">
                  {formatCurrency(analytics?.pendingEscrowRevenue)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Chờ khách xác nhận/hết khiếu nại
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                )}
              >
                <HiOutlineCash className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Tổng doanh số GMV */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Tổng Doanh Số (GMV)
                </p>
                <h3 className="mt-2 text-2xl font-black text-blue-500">
                  {formatCurrency(analytics?.totalRevenue)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Đơn hoàn tất: <strong>{analytics?.completedOrders || 0}</strong> đơn
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                )}
              >
                <HiOutlineShoppingBag className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Thực nhận & Hoa hồng */}
          <div
            className={cn(
              'rounded-2xl border p-5 transition-all shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900/80 text-white' : 'border-stone-200 bg-white text-stone-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Thực Nhận & Hoa Hồng
                </p>
                <h3 className="mt-2 text-2xl font-black text-purple-500">
                  {formatCurrency(analytics?.settledNetIncome)}
                </h3>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  Hoa hồng sàn: {formatCurrency(analytics?.totalCommissionPaid)}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                )}
              >
                <HiOutlineDocumentText className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Section: TẤT CẢ ĐƠN HÀNG CỦA GIAN HÀNG (PHÂN TRANG) */}
        <div
          className={cn(
            'rounded-2xl border overflow-hidden transition-all shadow-sm space-y-4 p-6',
            isDark ? 'border-slate-800 bg-slate-900/70' : 'border-stone-200 bg-white'
          )}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className={cn('text-lg font-black', isDark ? 'text-white' : 'text-stone-900')}>
                Danh Sách Đơn Hàng Của Gian Hàng
              </h2>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tất cả đơn hàng phát sinh từ gian hàng này. Bấm vào từng đơn hàng để xem chi tiết (Order Details).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadShopOrders}
                disabled={loadingOrders}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                )}
              >
                <HiOutlineRefresh className={cn('h-4 w-4', loadingOrders && 'animate-spin text-amber-500')} />
                <span>Làm mới đơn</span>
              </button>
            </div>
          </div>

          {/* Orders Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status filter dropdown */}
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold shrink-0', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Trạng thái:
              </span>
              <select
                value={orderStatus}
                onChange={(e) => {
                  setOrderStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                  isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-stone-300 bg-white text-stone-900'
                )}
              >
                {ADMIN_ORDER_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Order search input */}
            <div className="relative flex-1 max-w-md">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Tìm mã đơn, tên người mua, SĐT, mã vận đơn GHN..."
                className={cn(
                  'w-full rounded-xl border pl-9 pr-4 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400'
                )}
              />
            </div>
          </div>

          {/* Orders Content Table */}
          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <p className={cn('mt-3 text-xs font-semibold', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Đang tải danh sách đơn hàng...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <HiOutlineShoppingBag className={cn('mx-auto h-12 w-12', isDark ? 'text-slate-600' : 'text-stone-400')} />
              <p className={cn('mt-3 text-sm font-semibold', isDark ? 'text-slate-400' : 'text-stone-600')}>
                Gian hàng chưa có đơn hàng nào phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn('border-b text-xs font-bold uppercase tracking-wider', isDark ? 'border-slate-800 text-slate-400 bg-slate-800/40' : 'border-stone-200 text-stone-500 bg-stone-50')}>
                    <th className="px-4 py-3">Mã Đơn / Ngày Đặt</th>
                    <th className="px-4 py-3">Người Mua</th>
                    <th className="px-4 py-3">Sản Phẩm</th>
                    <th className="px-4 py-3 text-right">Tổng Tiền</th>
                    <th className="px-4 py-3 text-center">Thanh Toán / Ký Quỹ</th>
                    <th className="px-4 py-3 text-center">Trạng Thái Đơn</th>
                    <th className="px-4 py-3 text-center">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {paginatedOrders.map((order) => {
                    const statusBadge = getOrderStatusBadge(order)
                    const StatusIcon = statusBadge?.icon || HiOutlineShoppingBag
                    const firstItem = order.items?.[0]
                    const itemCount = order.items?.length || 0

                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-slate-800/40 group"
                      >
                        {/* Cột 1: Mã đơn & Ngày đặt */}
                        <td className="px-4 py-3.5">
                          <div>
                            <span className={cn('font-bold font-mono text-xs sm:text-sm group-hover:text-amber-500 transition-colors', isDark ? 'text-white' : 'text-stone-900')}>
                              {order.orderNumber || `#${order.id?.slice(0, 8)}`}
                            </span>
                            <p className={cn('text-[11px] mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                              {formatDate(order.createdAt)}
                            </p>
                            {order.shippingCode && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-500 font-mono mt-0.5">
                                <HiOutlineTruck className="h-3 w-3" />
                                <span>{order.shippingCode}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Cột 2: Người mua */}
                        <td className="px-4 py-3.5">
                          <div>
                            <p className={cn('font-semibold', isDark ? 'text-slate-200' : 'text-stone-800')}>
                              {order.userName || order.customerName || 'Khách vãng lai'}
                            </p>
                            <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                              {order.phoneNumber || order.phone || 'N/A'}
                            </p>
                            {order.shippingAddress && (
                              <p className={cn('text-[11px] truncate max-w-[150px]', isDark ? 'text-slate-500' : 'text-stone-400')}>
                                {order.shippingAddress}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Cột 3: Sản phẩm */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {firstItem?.productImageUrl && (
                              <img
                                src={firstItem.productImageUrl}
                                alt={firstItem.productName}
                                className="h-10 w-10 rounded-lg object-cover border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className={cn('font-medium text-xs truncate max-w-[180px]', isDark ? 'text-slate-200' : 'text-stone-800')}>
                                {firstItem?.productName || 'Sản phẩm công nghệ'}
                              </p>
                              <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                {itemCount > 1 ? `+${itemCount - 1} sản phẩm khác` : `SL: ${firstItem?.quantity || 1}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cột 4: Tổng tiền */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold text-emerald-500">
                            {formatCurrency(order.total)}
                          </span>
                        </td>

                        {/* Cột 5: Phương thức thanh toán & Ký quỹ đơn */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="space-y-1">
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded text-[11px] font-bold border',
                                order.paymentMethod === 'VNPAY'
                                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                                  : order.paymentMethod === 'WALLET'
                                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              )}
                            >
                              {order.paymentMethod || 'VNPAY'}
                            </span>
                            <div>
                              <span className={cn('text-[10px] font-semibold block', isDark ? 'text-slate-400' : 'text-stone-500')}>
                                Ký quỹ: {order.escrowStatus || 'HELD'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cột 6: Trạng thái đơn */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              statusBadge?.color || 'bg-stone-100 text-stone-700'
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span>{getOrderStatusLabel(order)}</span>
                          </span>
                        </td>

                        {/* Cột 7: Nút xem Order Details */}
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            to={`/orders/${order.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 shadow-sm',
                              isDark
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            )}
                          >
                            <span>Xem</span>
                            <HiOutlineArrowNarrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls for Orders */}
          {!loadingOrders && filteredOrders.length > 0 && (
            <div className="border-t border-stone-200 dark:border-slate-800 pt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalOrdersCount}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setCurrentPage(1)
                }}
                isDark={isDark}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showAdjustModal && (
        <AdjustFundModal
          shop={shopModalPayload}
          onClose={() => setShowAdjustModal(false)}
          onSuccess={() => {
            loadShopFullData()
            toast.success('Đã cập nhật quỹ ký quỹ thành công!')
          }}
          formatVND={formatCurrency}
        />
      )}

      {showDeductModal && fund && (
        <DeductCompensationModal
          fund={{ ...fund, shopName: shop.name }}
          onClose={() => setShowDeductModal(false)}
          onSuccess={() => {
            loadShopFullData()
            toast.success('Đã trích đền bù thành công!')
          }}
          formatVND={formatCurrency}
        />
      )}

      {showLedgerModal && fund && (
        <FundLedgerModal
          fund={fund}
          onClose={() => setShowLedgerModal(false)}
          formatVND={formatCurrency}
          formatDateTime={formatDate}
        />
      )}
    </div>
  )
}
